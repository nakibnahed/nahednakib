import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_TARGETS = [30, 60, 120, 180, 240];
const VALID_COLORS = ["orange", "blue", "green", "purple", "red"];
const VALID_ICONS = ["book", "code", "music", "language", "science", "art"];

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: goals, error } = await supabase
    .from("learning_goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/learning/goals:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }

  return NextResponse.json({ goals });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 100) {
    return NextResponse.json({ error: "Title is required and must be 100 characters or fewer" }, { status: 400 });
  }

  const daily_target_minutes = Number(body.daily_target_minutes);
  if (!VALID_TARGETS.includes(daily_target_minutes)) {
    return NextResponse.json({ error: "daily_target_minutes must be one of: 30, 60, 120, 180, 240" }, { status: 400 });
  }

  const color = VALID_COLORS.includes(body.color) ? body.color : "orange";
  const icon = VALID_ICONS.includes(body.icon) ? body.icon : "book";

  const { data: goal, error } = await supabase
    .from("learning_goals")
    .insert({ title, daily_target_minutes, color, icon, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("POST /api/learning/goals:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }

  return NextResponse.json({ goal }, { status: 201 });
}
