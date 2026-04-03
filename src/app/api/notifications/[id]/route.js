import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request, { params }) {
  try {
    const { id } = params;
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
      .delete()
      .eq("id", id)
      .eq("recipient_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete notification", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
