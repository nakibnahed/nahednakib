import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/seo/site";

export async function GET() {
  const base = getSiteUrl();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const metadata = {
    resource: base,
    authorization_servers: supabaseUrl ? [`${supabaseUrl}/auth/v1`] : [],
    scopes_supported: ["openid", "email", "profile"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${base}/.well-known/api-catalog`,
  };

  return NextResponse.json(metadata, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
