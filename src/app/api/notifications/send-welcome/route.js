import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has received a login notification in the last 30 minutes
    const thirtyMinutesAgo = new Date(
      Date.now() - 30 * 60 * 1000
    ).toISOString();
    const { data: recentLoginNotifications } = await supabase
      .from("notifications")
      .select("id")
      .eq("recipient_id", session.user.id)
      .eq("type", "user_login")
      .gte("created_at", thirtyMinutesAgo)
      .limit(1);

    // Only send login notification if none exists in the last 30 minutes
    if (!recentLoginNotifications || recentLoginNotifications.length === 0) {
      const currentTime = new Date().toLocaleTimeString();
      const { error } = await supabase.from("notifications").insert({
        title: "Welcome back! 👋",
        message: `You logged in at ${currentTime}. Great to see you again!`,
        type: "user_login",
        recipient_id: session.user.id,
        is_admin_notification: false,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error sending welcome notification:", error);
        return NextResponse.json(
          { error: "Failed to send welcome notification" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Login notification sent successfully",
      });
    } else {
      return NextResponse.json({
        message: "Recent login notification already exists, skipping",
      });
    }
  } catch (error) {
    console.error("Unexpected error in send-welcome API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
