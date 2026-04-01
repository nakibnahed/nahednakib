import { redirect } from "next/navigation";

/**
 * Alias URL: `/signup` → `/register` (same flow, query string preserved).
 */
export default async function SignupAliasPage({ searchParams }) {
  const sp = await searchParams;
  const q = new URLSearchParams(sp).toString();
  redirect(q ? `/register?${q}` : "/register");
}
