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

    // First count how many notifications will be deleted
    const { count: notificationCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", session.user.id);

    console.log(
      `📊 Found ${notificationCount || 0} notifications to delete for user:`,
      session.user.id
    );

    // Delete all notifications for the current user
    const { data: deletedData, error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", session.user.id)
      .select();

    if (deleteError) {
      console.error("❌ Error clearing notifications:", deleteError);
      return NextResponse.json(
        { error: "Failed to clear notifications" },
        { status: 500 }
      );
    }

    const actualDeletedCount = deletedData ? deletedData.length : 0;
    console.log(
      `✅ Successfully deleted ${actualDeletedCount} notifications for user:`,
      session.user.id
    );
    console.log("Deleted notifications:", deletedData);

    // Verify deletion by counting remaining notifications
    const { count: remainingCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", session.user.id);

    console.log(
      `🔍 Verification: ${remainingCount || 0} notifications remaining for user`
    );

    return NextResponse.json({
      success: true,
      expectedCount: notificationCount || 0,
      actualDeletedCount: actualDeletedCount,
      remainingCount: remainingCount || 0,
      fullyCleared: (remainingCount || 0) === 0,
    });
  } catch (error) {
    console.error("Error in clear-all notifications route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
