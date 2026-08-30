"use server";
export async function convertIntakeToProject(
  _intakeId: string,
): Promise<{ ok: boolean; error?: string }> {
  return { ok: true };
}
