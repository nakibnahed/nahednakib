import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  try {
    console.log("🔍 DELETE /api/notifications/clear-all - Starting request");

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session check:", { hasSession: !!session, sessionError });

    if (!session?.user) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("✅ User authenticated:", session.user.id);

    // Delete all notifications for the current user
    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", session.user.id);

    if (deleteError) {
      console.error("❌ Error clearing notifications:", deleteError);
      return NextResponse.json(
        { error: "Failed to clear notifications" },
        { status: 500 }
      );
    }

    console.log(
      "✅ Successfully cleared all notifications for user:",
      session.user.id
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in clear-all notifications route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
