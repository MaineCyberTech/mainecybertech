import { encryptObject, decryptObject } from "./field-encryption";

export const PROFILE_PII_FIELDS = ["full_name", "email", "phone", "title"] as const;
export type ProfilePiiField = (typeof PROFILE_PII_FIELDS)[number];

export type ProfilePiiMap = Partial<Record<ProfilePiiField, string | null>>;

export function encryptProfilePii(current: ProfilePiiMap, changes: ProfilePiiMap): Record<string, unknown> {
  const merged: Record<ProfilePiiField, string | null | undefined> = {
    full_name: changes.full_name !== undefined ? changes.full_name : current.full_name,
    email: changes.email !== undefined ? changes.email : current.email,
    phone: changes.phone !== undefined ? changes.phone : current.phone,
    title: changes.title !== undefined ? changes.title : current.title,
  };

  const toEncrypt: Record<string, unknown> = {};
  for (const field of PROFILE_PII_FIELDS) {
    const value = merged[field];
    if (value !== undefined && value !== null) {
      toEncrypt[field] = value;
    }
  }
  return encryptObject(toEncrypt);
}

export function decryptProfilePii(encrypted: Record<string, unknown> | null | undefined): ProfilePiiMap {
  if (!encrypted) return {};
  return decryptObject(encrypted) as ProfilePiiMap;
}
