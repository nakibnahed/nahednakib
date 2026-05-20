import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/utils/isUuid";

function prevDay(dateStr) {
  return new Date(new Date(dateStr).getTime() - 86400000).toISOString().slice(0, 10);
}

function computeStreak(dates) {
  if (!dates.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = prevDay(today);
  let expected = dates[0] === today || dates[0] === yesterday ? dates[0] : null;
  if (!expected) return 0;
  let streak = 0;
  for (const d of dates) {
    if (d === expected) { streak++; expected = prevDay(expected); }
    else break;
  }
  return streak;
}

export async function GET(request, { params }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { goalId } = await params;
  if (!isUuid(goalId)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
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

  const [countResult, sumResult, datesResult] = await Promise.all([
    supabase
      .from("learning_sessions")
      .select("id", { count: "exact", head: true })
      .eq("goal_id", goalId)
      .eq("user_id", user.id),
    supabase
      .from("learning_sessions")
      .select("duration_seconds, target_minutes")
      .eq("goal_id", goalId)
      .eq("user_id", user.id),
    supabase
      .from("learning_sessions")
      .select("date, duration_seconds, target_minutes")
      .eq("goal_id", goalId)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(90),
  ]);

  const totalSessions = countResult.count ?? 0;

  const sessions = sumResult.data || [];
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  const distinctDates = [...new Set((datesResult.data || []).map((s) => s.date))];
  const streak = computeStreak(distinctDates);

  return NextResponse.json({ streak, totalSessions, totalMinutes });
}
