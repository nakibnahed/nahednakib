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

    // Send login notification
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
  } catch (error) {
    console.error("Unexpected error in send-welcome API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
