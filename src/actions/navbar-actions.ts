"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function redirectToLogin() {
  redirect("/login");
}

export async function defaultSignOut() {
  const cookieStore = await cookies();
  cookieStore.delete("kalivergo_user");
  cookieStore.delete("kalivergo_tenant");
  redirect("/login");
}
