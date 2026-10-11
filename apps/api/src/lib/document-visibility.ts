/**
 * Application-side mirror of the database `can_read_document(uuid)` predicate
 * (supabase/migrations/5302129_supabase_rls_audit_fixes.sql, "can_read_document
 * helper (bootstrap + 5302110 restore)").
 *
 * Why this exists: the API talks to Postgres with the service-role client
 * unless a module is explicitly opted into RLS (`RLS_READS_ENABLED`), and the
 * service role bypasses every RLS policy. Any path that reads `documents` with
 * the admin client must therefore enforce the visibility model in code or not
 * at all:
 *   - document downloads / signed URLs (FILE-P2-007)
 *   - admin global search (SEARCH-P2-008)
 *
 * The rules below are a line-by-line mirror of the SQL helper. If the
 * migration changes, this file must change with it. `is_super_admin()` reads
 * the profile flag; everything else is derived from the caller's approved
 * memberships, effective `documents:edit` grants and `document_permissions`
 * rows, exactly like `user_has_role` / `user_has_permission` do.
 */
import { getSupabaseAdmin } from "../services/supabase";
import { roleKeyOf } from "./roles";

/** Role keys allowed to read `internal` documents in their organization. */
export const INTERNAL_DOCUMENT_ROLE_KEYS = [
  "admin",
  "super_admin",
  "technician",
  "engineer",
  "dispatcher",
  "security-analyst",
  "project-manager",
  "finance",
  "onboarding-specialist",
] as const;

/** The document columns the predicate needs. */
export interface DocumentVisibilityFields {
  id?: string | null;
  organization_id?: string | null;
  visibility?: string | null;
  uploaded_by?: string | null;
}

/** Everything `can_read_document` needs to know about the caller. */
export interface DocumentReadScope {
  userId: string;
  isSuperAdmin: boolean;
  /** Organizations where the caller holds an approved membership. */
  memberOrgIds: Set<string>;
  /** Organizations where the caller's effective permissions include documents:edit. */
  editOrgIds: Set<string>;
  /** Approved role keys per organization. */
  roleKeysByOrg: Map<string, Set<string>>;
  /** Approved membership role ids per organization (for role-based grants). */
  roleIdsByOrg: Map<string, Set<string>>;
  /** Document ids with a direct (user_id) `document_permissions` view grant. */
  directGrantDocumentIds: Set<string>;
  /** Document id -> role ids with a `document_permissions` view grant. */
  roleGrantDocumentIds: Map<string, Set<string>>;
}

function emptyDocumentReadScope(userId: string, isSuperAdmin = false): DocumentReadScope {
  return {
    userId,
    isSuperAdmin,
    memberOrgIds: new Set(),
    editOrgIds: new Set(),
    roleKeysByOrg: new Map(),
    roleIdsByOrg: new Map(),
    directGrantDocumentIds: new Set(),
    roleGrantDocumentIds: new Map(),
  };
}

function addToSet<K, V>(map: Map<K, Set<V>>, key: K, value: V): void {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  set.add(value);
}

/**
 * Resolve the caller's read scope.
 *
 * `orgIds` narrows the membership/permission lookups (pass the organizations
 * that can actually appear in the result set). `documentIds` bounds the
 * `document_permissions` grant lookup to the candidate documents.
 * `isSuperAdmin` lets a caller that already resolved the profile flag (admin
 * search does) skip the duplicate profile read.
 */
export async function resolveDocumentReadScope(
  userId: string,
  opts: { orgIds?: string[]; documentIds?: string[]; isSuperAdmin?: boolean } = {},
): Promise<DocumentReadScope> {
  const { orgIds, documentIds, isSuperAdmin: knownSuperAdmin } = opts;
  if (orgIds && orgIds.length === 0) return emptyDocumentReadScope(userId);
  if (knownSuperAdmin === true) return emptyDocumentReadScope(userId, true);

  const supabase = getSupabaseAdmin();

  const membershipsQuery = supabase
    .from("memberships")
    .select("organization_id, role_id, roles(key)")
    .eq("user_id", userId)
    .eq("status", "approved");

  const [profileResult, membershipsResult] = await Promise.all([
    knownSuperAdmin === undefined
      ? supabase.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
    orgIds ? membershipsQuery.in("organization_id", orgIds) : membershipsQuery,
  ]);

  // is_super_admin() short-circuits the whole predicate.
  const isSuperAdmin =
    knownSuperAdmin ??
    (profileResult?.data as { is_super_admin?: boolean } | null)?.is_super_admin === true;
  if (isSuperAdmin) {
    return emptyDocumentReadScope(userId, true);
  }

  const scope = emptyDocumentReadScope(userId);
  const allRoleIds = new Set<string>();

  for (const membership of (membershipsResult?.data ?? []) as Array<{
    organization_id?: string | null;
    role_id?: string | null;
    roles?: unknown;
  }>) {
    const orgId = membership.organization_id;
    if (!orgId) continue;
    scope.memberOrgIds.add(orgId);
    const roleKey = roleKeyOf(membership.roles);
    if (roleKey) addToSet(scope.roleKeysByOrg, orgId, roleKey);
    if (membership.role_id) {
      addToSet(scope.roleIdsByOrg, orgId, membership.role_id);
      allRoleIds.add(membership.role_id);
    }
  }

  const roleIds = [...allRoleIds];
  const docIds = (documentIds ?? []).filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );

  const [rolePermissionRows, editPermissionRows, overrideRows, directGrantRows, roleGrantRows] =
    await Promise.all([
      roleIds.length > 0
        ? supabase.from("role_permissions").select("role_id, permission_id").in("role_id", roleIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("permissions")
        .select("id")
        .eq("module_key", "documents")
        .eq("action_key", "edit"),
      supabase
        .from("user_permission_overrides")
        .select("organization_id, permission_id, is_allowed")
        .eq("user_id", userId),
      docIds.length > 0
        ? supabase
            .from("document_permissions")
            .select("document_id")
            .eq("user_id", userId)
            .eq("can_view", true)
            .in("document_id", docIds)
        : Promise.resolve({ data: [] }),
      docIds.length > 0 && roleIds.length > 0
        ? supabase
            .from("document_permissions")
            .select("document_id, role_id")
            .eq("can_view", true)
            .in("document_id", docIds)
            .in("role_id", roleIds)
        : Promise.resolve({ data: [] }),
    ]);

  // documents:edit = union of role_permissions for the caller's roles in the
  // org, then per-org user_permission_overrides (allow adds, deny removes).
  const editPermissionIds = new Set<string>(
    ((editPermissionRows?.data ?? []) as Array<{ id: string }>).map((permission) => permission.id),
  );
  const rolesWithEditPermission = new Set<string>();
  for (const rolePermission of (rolePermissionRows?.data ?? []) as Array<{
    role_id: string;
    permission_id: string;
  }>) {
    if (editPermissionIds.has(rolePermission.permission_id)) {
      rolesWithEditPermission.add(rolePermission.role_id);
    }
  }
  for (const [orgId, orgRoleIds] of scope.roleIdsByOrg) {
    for (const roleId of orgRoleIds) {
      if (rolesWithEditPermission.has(roleId)) {
        scope.editOrgIds.add(orgId);
        break;
      }
    }
  }
  for (const override of (overrideRows?.data ?? []) as Array<{
    organization_id: string;
    permission_id: string;
    is_allowed: boolean;
  }>) {
    if (!editPermissionIds.has(override.permission_id)) continue;
    if (override.is_allowed) scope.editOrgIds.add(override.organization_id);
    else scope.editOrgIds.delete(override.organization_id);
  }

  for (const grant of (directGrantRows?.data ?? []) as Array<{ document_id: string }>) {
    scope.directGrantDocumentIds.add(grant.document_id);
  }
  for (const grant of (roleGrantRows?.data ?? []) as Array<{
    document_id: string;
    role_id?: string | null;
  }>) {
    if (grant.role_id) addToSet(scope.roleGrantDocumentIds, grant.document_id, grant.role_id);
  }

  return scope;
}

/**
 * The `can_read_document` predicate. Fails closed on an unknown/absent
 * visibility value so a malformed row can never be treated as readable.
 */
export function canReadDocument(
  scope: DocumentReadScope,
  document: DocumentVisibilityFields,
): boolean {
  if (scope.isSuperAdmin) return true;

  const orgId = document.organization_id ?? null;
  const isUploader =
    typeof document.uploaded_by === "string" && document.uploaded_by === scope.userId;
  const isApprovedMember = orgId != null && scope.memberOrgIds.has(orgId);
  const canEdit = orgId != null && scope.editOrgIds.has(orgId);

  switch (document.visibility) {
    case "public":
      return true;

    case "org":
      return isApprovedMember;

    case "internal": {
      if (isUploader || canEdit) return true;
      const roleKeys = orgId != null ? scope.roleKeysByOrg.get(orgId) : undefined;
      return Boolean(roleKeys && INTERNAL_DOCUMENT_ROLE_KEYS.some((key) => roleKeys.has(key)));
    }

    case "private": {
      if (isUploader || canEdit) return true;
      const documentId = document.id;
      if (documentId && scope.directGrantDocumentIds.has(documentId)) return true;
      // A role grant only applies in the organization where the caller
      // actually holds that role (mirrors the memberships join in SQL).
      const grantedRoleIds = documentId ? scope.roleGrantDocumentIds.get(documentId) : undefined;
      const callerRoleIds = orgId != null ? scope.roleIdsByOrg.get(orgId) : undefined;
      if (grantedRoleIds && callerRoleIds) {
        for (const roleId of grantedRoleIds) {
          if (callerRoleIds.has(roleId)) return true;
        }
      }
      return false;
    }

    default:
      return false;
  }
}

/** Resolve the scope for one document and answer whether the caller may read it. */
export async function canReadDocumentById(
  userId: string,
  document: DocumentVisibilityFields,
): Promise<boolean> {
  const scope = await resolveDocumentReadScope(userId, {
    orgIds: document.organization_id ? [document.organization_id] : undefined,
    documentIds: document.id ? [document.id] : undefined,
  });
  return canReadDocument(scope, document);
}

/**
 * Drop every document the caller cannot read. `orgIds` narrows the scope
 * lookup (search passes the caller's resolved org set); `isSuperAdmin` lets a
 * caller that already resolved the profile flag skip the duplicate read.
 */
export async function filterReadableDocuments<T extends DocumentVisibilityFields>(
  userId: string,
  documents: T[],
  opts: { orgIds?: string[]; isSuperAdmin?: boolean } = {},
): Promise<T[]> {
  if (documents.length === 0) return [];
  const scope = await resolveDocumentReadScope(userId, {
    orgIds: opts.orgIds,
    isSuperAdmin: opts.isSuperAdmin,
    documentIds: documents
      .map((document) => document.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  });
  return documents.filter((document) => canReadDocument(scope, document));
}
