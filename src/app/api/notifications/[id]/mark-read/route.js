import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request, { params }) {
  try {
    console.log("🔍 POST /api/notifications/[id]/mark-read - Starting request");

    const { id } = params;
    console.log("Notification ID:", id);

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session check:", {
      hasSession: !!session,
      sessionError,
      userId: session?.user?.id,
    });

    if (!session?.user) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("✅ Session confirmed, updating notification:", id);

    // Mark the specific notification as read
    const { data, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("recipient_id", session.user.id)
      .select();

    if (error) {
      console.error("❌ Error marking notification as read:", error);
      return NextResponse.json(
        {
          error: "Failed to mark notification as read",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    console.log("✅ Successfully marked notification as read:", data);

    return NextResponse.json({
      message: "Notification marked as read",
      data,
    });
  } catch (error) {
    console.error("❌ Unexpected error in mark-read:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
