import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req) {
  const res = NextResponse.next();

  if (!req.nextUrl.pathname.startsWith("/admin")) return res;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const access_token = req.cookies.get("sb-access-token")?.value;

  if (!access_token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser(access_token);

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}
