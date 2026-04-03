import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request, { params }) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("recipient_id", user.id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to mark notification as read", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Notification marked as read",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
