import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    console.log("🔍 Testing notifications table...");

    const supabase = await createClient();

    // Test 1: Check if we can connect
    console.log("✅ Supabase client created");

    // Test 2: Check session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("Session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionError,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // Test 3: Simple table check
    const { data: tableTest, error: tableError } = await supabase
      .from("notifications")
      .select("id")
      .limit(1);

    console.log("Table test:", { data: tableTest, error: tableError });

    if (tableError) {
      return NextResponse.json(
        {
          error: "Table access failed",
          details: tableError.message,
          code: tableError.code,
        },
        { status: 500 }
      );
    }

    // Test 4: Try to query with user filter
    const { data: userTest, error: userError } = await supabase
      .from("notifications")
      .select("id")
      .eq("recipient_id", session.user.id)
      .limit(1);

    console.log("User test:", { data: userTest, error: userError });

    if (userError) {
      return NextResponse.json(
        {
          error: "User query failed",
          details: userError.message,
          code: userError.code,
          hint: "This is likely a RLS policy issue",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tableTest: tableTest?.length || 0,
      userTest: userTest?.length || 0,
      userId: session.user.id,
    });
  } catch (error) {
    console.error("❌ Test failed:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
