import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/utils/isUuid";

const VALID_TARGETS = [30, 60, 120, 180, 240];

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get("goalId");
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 50);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  if (!goalId || !isUuid(goalId)) {
    return NextResponse.json({ error: "Valid goalId is required" }, { status: 400 });
  }

  const { data: goal } = await supabase
    .from("learning_goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const { data: rows, error } = await supabase
    .from("learning_sessions")
    .select("*")
    .eq("goal_id", goalId)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("started_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    console.error("GET /api/learning/sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }

  const sessions = rows.slice(0, limit);
  const hasMore = rows.length > limit;

  return NextResponse.json({ sessions, hasMore });
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

  const { goalId, startedAt, endedAt, durationSeconds, targetMinutes, notes } = body;

  if (!goalId || !isUuid(goalId)) {
    return NextResponse.json({ error: "Valid goalId is required" }, { status: 400 });
  }

  const startDate = new Date(startedAt);
  const endDate = new Date(endedAt);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
    return NextResponse.json({ error: "startedAt and endedAt must be valid dates with endedAt after startedAt" }, { status: 400 });
  }

  const durationSec = Number(durationSeconds);
  if (!Number.isInteger(durationSec) || durationSec < 1 || durationSec > 86400) {
    return NextResponse.json({ error: "durationSeconds must be an integer between 1 and 86400" }, { status: 400 });
  }

  const targetMins = Number(targetMinutes);
  if (!VALID_TARGETS.includes(targetMins)) {
    return NextResponse.json({ error: "targetMinutes must be one of: 30, 60, 120, 180, 240" }, { status: 400 });
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== "string" || notes.length > 500) {
      return NextResponse.json({ error: "Notes must be a string of 500 characters or fewer" }, { status: 400 });
    }
  }

  const { data: goal } = await supabase
    .from("learning_goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .eq("archived", false)
    .single();

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const date = startDate.toISOString().slice(0, 10);

  const { data: session, error } = await supabase
    .from("learning_sessions")
    .insert({
      goal_id: goalId,
      user_id: user.id,
      started_at: startDate.toISOString(),
      ended_at: endDate.toISOString(),
      duration_seconds: durationSec,
      target_minutes: targetMins,
      date,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("POST /api/learning/sessions:", error);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }

  return NextResponse.json({ session }, { status: 201 });
}
