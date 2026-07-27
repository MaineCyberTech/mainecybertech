import { getSupabaseAdmin } from "./supabase";
import { logAuditEvent } from "./audit";
import { AppError, success } from "../types";

export interface DynamicForm {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  form_type: string;
  status: string;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    placeholder: string | null;
    options: string[];
    helpText: string | null;
    validation: Record<string, unknown>;
    sortOrder: number;
  }>;
  settings: Record<string, unknown>;
  published_at: string | null;
  closes_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  organization_id: string;
  respondent_id: string | null;
  respondent_email: string | null;
  answers: Record<string, unknown>;
  status: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export async function listDynamicForms(
  organizationId: string,
  options: { status?: string; formType?: string; page: number; limit: number },
) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("dynamic_client_forms")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId);

  if (options.status) query = query.eq("status", options.status);
  if (options.formType) query = query.eq("form_type", options.formType);

  const from = (options.page - 1) * options.limit;
  const to = from + options.limit - 1;
  query = query.range(from, to).order("created_at", { ascending: false });

  const { data, error, count } = await query;
  if (error) throw new AppError("DB_ERROR", error.message, 500);

  return success({
    items: data ?? [],
    total: count ?? 0,
    page: options.page,
    limit: options.limit,
  });
}

export async function getDynamicForm(organizationId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dynamic_client_forms")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (error) throw new AppError("NOT_FOUND", "Form not found", 404);
  return success(data);
}

export async function createDynamicForm(
  organizationId: string,
  userId: string,
  input: {
    title: string;
    description?: string | null;
    formType?: string;
    fields?: DynamicForm["fields"];
    settings?: Record<string, unknown>;
    closesAt?: string | null;
  },
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dynamic_client_forms")
    .insert({
      organization_id: organizationId,
      title: input.title,
      description: input.description ?? null,
      form_type: input.formType ?? "intake",
      status: "draft",
      fields: input.fields ?? [],
      settings: input.settings ?? {},
      closes_at: input.closesAt ?? null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "create",
    entityType: "dynamic_form",
    entityId: data.id,
    metadata: { title: input.title, formType: input.formType },
  });

  return success(data);
}

export async function updateDynamicForm(
  organizationId: string,
  userId: string,
  id: string,
  input: {
    title?: string;
    description?: string | null;
    formType?: string;
    status?: string;
    fields?: DynamicForm["fields"];
    settings?: Record<string, unknown>;
    closesAt?: string | null;
  },
) {
  const supabase = getSupabaseAdmin();
  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.formType !== undefined) updateData.form_type = input.formType;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.fields !== undefined) updateData.fields = input.fields;
  if (input.settings !== undefined) updateData.settings = input.settings;
  if (input.closesAt !== undefined) updateData.closes_at = input.closesAt;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("dynamic_client_forms")
    .update(updateData)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "update",
    entityType: "dynamic_form",
    entityId: id,
    metadata: { fields: Object.keys(input) },
  });

  return success(data);
}

export async function deleteDynamicForm(organizationId: string, userId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("dynamic_client_forms")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", id);

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "delete",
    entityType: "dynamic_form",
    entityId: id,
  });

  return success({ deleted: true });
}

export async function publishDynamicForm(
  organizationId: string,
  userId: string,
  id: string,
  closesAt?: string | null,
) {
  const supabase = getSupabaseAdmin();
  const updateData: Record<string, unknown> = {
    status: "published",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (closesAt !== undefined) updateData.closes_at = closesAt;

  const { data, error } = await supabase
    .from("dynamic_client_forms")
    .update(updateData)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .eq("status", "draft")
    .select()
    .single();

  if (error || !data) throw new AppError("INVALID_STATE", "Only draft forms can be published", 400);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "update",
    entityType: "dynamic_form",
    entityId: id,
    metadata: { action: "publish" },
  });

  return success(data);
}

export async function submitDynamicForm(
  organizationId: string,
  formId: string,
  respondentEmail: string | null,
  answers: Record<string, unknown>,
) {
  const supabase = getSupabaseAdmin();

  const { data: form, error: formError } = await supabase
    .from("dynamic_client_forms")
    .select("id, status, closes_at")
    .eq("organization_id", organizationId)
    .eq("id", formId)
    .single();

  if (formError || !form) throw new AppError("NOT_FOUND", "Form not found", 404);
  if (form.status !== "published")
    throw new AppError("INVALID_STATE", "Form is not published", 400);
  if (form.closes_at && new Date(form.closes_at) < new Date()) {
    throw new AppError("INVALID_STATE", "Form is closed", 400);
  }

  const { data, error } = await supabase
    .from("dynamic_form_submissions")
    .insert({
      form_id: formId,
      organization_id: organizationId,
      respondent_email: respondentEmail,
      answers,
      status: "submitted",
    })
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    action: "create",
    entityType: "form_submission",
    entityId: data.id,
    metadata: { formId, respondentEmail },
  });

  return success(data);
}

export async function listFormSubmissions(
  organizationId: string,
  formId: string,
  options: { page: number; limit: number },
) {
  const supabase = getSupabaseAdmin();
  const from = (options.page - 1) * options.limit;
  const to = from + options.limit - 1;

  const { data, error, count } = await supabase
    .from("dynamic_form_submissions")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false })
    .range(from, to);

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  return success({
    items: data ?? [],
    total: count ?? 0,
    page: options.page,
    limit: options.limit,
  });
}

export async function exportDynamicForms(
  organizationId: string,
  options: { status?: string; formType?: string; format: "csv" | "json" },
) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("dynamic_client_forms")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (options.status) query = query.eq("status", options.status);
  if (options.formType) query = query.eq("form_type", options.formType);

  const { data, error } = await query;
  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    action: "export",
    entityType: "dynamic_form",
    metadata: { format: options.format, count: data?.length ?? 0 },
  });

  return success(data ?? []);
}
