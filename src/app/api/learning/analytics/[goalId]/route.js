import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/utils/isUuid";

function prevDay(dateStr) {
  return new Date(new Date(dateStr).getTime() - 86400000).toISOString().slice(0, 10);
}

function computeStreaks(sortedDatesDesc) {
  if (!sortedDatesDesc.length) return { current: 0, longest: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = prevDay(today);

  let current = 0;
  let longest = 0;
  let runLength = 1;

  let expected = sortedDatesDesc[0] === today || sortedDatesDesc[0] === yesterday ? sortedDatesDesc[0] : null;
  if (expected) {
    current = 1;
    expected = prevDay(expected);
    for (let i = 1; i < sortedDatesDesc.length; i++) {
      if (sortedDatesDesc[i] === expected) { current++; expected = prevDay(expected); }
      else break;
    }
  }

  for (let i = 1; i < sortedDatesDesc.length; i++) {
    if (sortedDatesDesc[i] === prevDay(sortedDatesDesc[i - 1])) { runLength++; }
    else { longest = Math.max(longest, runLength); runLength = 1; }
  }
  longest = Math.max(longest, runLength, current);

  return { current, longest };
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
    .select("id, daily_target_minutes")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const since365 = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);

  const { data: rows, error } = await supabase
    .from("learning_sessions")
    .select("date, duration_seconds, target_minutes, started_at")
    .eq("goal_id", goalId)
    .eq("user_id", user.id)
    .gte("date", since365)
    .order("date", { ascending: false });

  if (error) {
    console.error("GET /api/learning/analytics/[goalId]:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }

  const sessions = rows || [];

  const today = new Date().toISOString().slice(0, 10);
  const last7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const last30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const last90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  const targetSec = goal.daily_target_minutes * 60;

  let weeklySeconds = 0, weeklySessions = 0, weeklyCompleted = 0;
  let monthlySeconds = 0, monthlySessions = 0, monthlyCompleted = 0;

  const activeDaysLast30 = new Set();
  const dateMinutesMap = {};
  let bestDayDate = null;
  let bestDayMinutes = 0;

  for (const s of sessions) {
    const mins = Math.round(s.duration_seconds / 60);
    const completed = s.duration_seconds >= targetSec;

    if (s.date >= last7) {
      weeklySeconds += s.duration_seconds;
      weeklySessions++;
      if (completed) weeklyCompleted++;
    }
    if (s.date >= last30) {
      monthlySeconds += s.duration_seconds;
      monthlySessions++;
      if (completed) monthlyCompleted++;
      activeDaysLast30.add(s.date);
    }

    if (!dateMinutesMap[s.date]) dateMinutesMap[s.date] = 0;
    dateMinutesMap[s.date] += mins;
  }

  for (const [date, mins] of Object.entries(dateMinutesMap)) {
    if (mins > bestDayMinutes) { bestDayMinutes = mins; bestDayDate = date; }
  }

  const distinctDatesDesc = [...new Set(sessions.map((s) => s.date))].sort((a, b) => b.localeCompare(a));
  const { current: currentStreak, longest: longestStreak } = computeStreaks(distinctDatesDesc);

  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((acc, s) => acc + s.duration_seconds, 0);
  const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));
  const averageSessionMinutes = totalSessions > 0 ? Math.round(totalSeconds / totalSessions / 60) : 0;

  const weeklyMinutes = Math.round(weeklySeconds / 60);
  const monthlyMinutes = Math.round(monthlySeconds / 60);
  const weeklyCompletionRate = weeklySessions > 0 ? Math.round((weeklyCompleted / weeklySessions) * 100) : 0;
  const monthlyCompletionRate = monthlySessions > 0 ? Math.round((monthlyCompleted / monthlySessions) * 100) : 0;

  const activeDays30 = activeDaysLast30.size;
  const completionRate = monthlyCompletionRate;
  const consistencyScore = Math.min(
    100,
    Math.round(
      (Math.min(currentStreak, 30) / 30) * 25 +
      (completionRate / 100) * 25 +
      (activeDays30 / 30) * 25 +
      Math.min(weeklyMinutes / 300, 1) * 25
    )
  );

  const heatmap = [];
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const cursor = new Date(todayUTC);
  cursor.setUTCDate(cursor.getUTCDate() - 90);
  while (cursor <= todayUTC) {
    const dateStr = cursor.toISOString().slice(0, 10);
    heatmap.push({ date: dateStr, minutes: dateMinutesMap[dateStr] || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return NextResponse.json({
    weeklyMinutes,
    monthlyMinutes,
    weeklySessions,
    monthlySessions,
    weeklyCompletionRate,
    monthlyCompletionRate,
    currentStreak,
    longestStreak,
    bestDay: bestDayDate ? { date: bestDayDate, minutes: bestDayMinutes } : null,
    averageSessionMinutes,
    totalHours,
    totalSessions,
    consistencyScore,
    heatmap,
  });
}
