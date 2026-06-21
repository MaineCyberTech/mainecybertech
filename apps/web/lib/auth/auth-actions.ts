"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { MCTClient, ApiError } from "@mct/sdk";
import { getCookieOptions } from "@/lib/cookie-domain";

const SESSION_COOKIE = "mct_session";

function unauthClient() {
  return MCTClient.create({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  });
}

export async function loginAction(email: string, password: string) {
  try {
    const result = await unauthClient().auth.signIn(email, password);
    const cookieStore = await cookies();
    const headersList = await headers();
    const host = headersList.get("host") || "";
    cookieStore.set(SESSION_COOKIE, result.accessToken, getCookieOptions(host));
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "An unexpected error occurred";
    return { error: message };
  }
  redirect("/portal/dashboard");
}

export async function signupAction(
  email: string,
  password: string,
  fullName: string,
) {
  try {
    await unauthClient().auth.signUp(email, password, fullName);
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "An unexpected error occurred";
    return { error: message };
  }
  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
