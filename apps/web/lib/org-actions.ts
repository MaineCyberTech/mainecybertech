"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const ORG_COOKIE = "mct_active_org";

export async function setActiveOrg(organizationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
}

export async function getActiveOrg(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ORG_COOKIE)?.value ?? null;
}
