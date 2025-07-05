import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔍 Testing session endpoint");

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session debug:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      sessionError: sessionError,
    });

    if (sessionError) {
      return NextResponse.json(
        { error: "Session error", details: sessionError },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          error: "Profile error",
          details: profileError,
          userId: session.user.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Session is working",
      user: {
        id: session.user.id,
        email: session.user.email,
        role: profile?.role || "user",
      },
    });
  } catch (error) {
    console.error("Test session error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
