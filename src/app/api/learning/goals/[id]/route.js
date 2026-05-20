import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/utils/isUuid";

const VALID_TARGETS = [30, 60, 120, 180, 240];
const VALID_COLORS = ["orange", "blue", "green", "purple", "red"];
const VALID_ICONS = ["book", "code", "music", "language", "science", "art"];

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 100) {
      return NextResponse.json({ error: "Title must be 1–100 characters" }, { status: 400 });
    }
    updateData.title = title;
  }

  if (body.daily_target_minutes !== undefined) {
    const daily_target_minutes = Number(body.daily_target_minutes);
    if (!VALID_TARGETS.includes(daily_target_minutes)) {
      return NextResponse.json({ error: "daily_target_minutes must be one of: 30, 60, 120, 180, 240" }, { status: 400 });
    }
    updateData.daily_target_minutes = daily_target_minutes;
  }

  if (body.color !== undefined) {
    if (!VALID_COLORS.includes(body.color)) {
      return NextResponse.json({ error: "Invalid color" }, { status: 400 });
    }
    updateData.color = body.color;
  }

  if (body.icon !== undefined) {
    if (!VALID_ICONS.includes(body.icon)) {
      return NextResponse.json({ error: "Invalid icon" }, { status: 400 });
    }
    updateData.icon = body.icon;
  }

  if (body.archived !== undefined) {
    updateData.archived = Boolean(body.archived);
  }

  const { data: goal, error } = await supabase
    .from("learning_goals")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("PATCH /api/learning/goals/[id]:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json({ goal });
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("learning_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("DELETE /api/learning/goals/[id]:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
