import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only this account may manage authors (create/update/delete). */
export const MAIN_ADMIN_EMAIL = "nahednakibyos@gmail.com";

export async function requireMainAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (user.email !== MAIN_ADMIN_EMAIL) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, supabase };
}
