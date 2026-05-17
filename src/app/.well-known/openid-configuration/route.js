import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: "Auth server not configured" }, { status: 503 });
  }
  return NextResponse.redirect(
    `${supabaseUrl}/auth/v1/.well-known/openid-configuration`,
    { status: 302 }
  );
}
