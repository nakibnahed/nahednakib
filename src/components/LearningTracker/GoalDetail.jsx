"use client";

import { useEffect } from "react";
import { Timer as TimerIcon, BarChart2, CalendarDays, History } from "lucide-react";
import be from "@/app/admin/blogs/BlogEditor.module.css";
import { useLearning } from "@/hooks/useLearning";
import { showAppToast } from "@/lib/showAppToast";
import Timer from "./Timer";
import GoalStats from "./GoalStats";
import LearningAnalytics from "./LearningAnalytics";
import LearningHeatmap from "./LearningHeatmap";
import SessionHistory from "./SessionHistory";
import styles from "./GoalDetail.module.css";

export default function GoalDetail({ goal }) {
  const {
    loading,
    sessions,
    hasMoreSessions,
    stats,
    analytics,
    error,
    saveSession,
    loadMoreSessions,
    fetchAnalytics,
  } = useLearning(goal.id);

  useEffect(() => {
    fetchAnalytics(goal.id);
  }, [goal.id, fetchAnalytics]);

  useEffect(() => {
    if (error) showAppToast(error, "error");
  }, [error]);

  async function handleSessionSave(payload) {
    const result = await saveSession(payload);
    if (result?.success) {
      const completed = payload.durationSeconds >= payload.targetMinutes * 60;
      const mins = Math.round(payload.durationSeconds / 60);
      if (completed) showAppToast(`Great job! You completed your ${payload.targetMinutes}m goal!`, "success");
      else showAppToast(`Session saved — ${mins} minutes tracked.`, "success");
      fetchAnalytics(goal.id);
    }
  }

  return (
    <div className={styles.wrap}>
      {/* Timer section */}
      <section className={be.section}>
        <div className={styles.timerCard}>
          <div className={`${styles.timerCardHeader} ${be.sectionHead}`}>
            <div className={be.sectionIcon}>
              <TimerIcon size={20} strokeWidth={1.75} />
            </div>
            <div className={be.sectionHeadText}>
              <p className={be.sectionKicker}>Session</p>
              <h2 className={be.sectionTitle}>{goal.title}</h2>
            </div>
            <span className={styles.timerGoalTarget}>
              {goal.daily_target_minutes < 60
                ? `${goal.daily_target_minutes}m / day`
                : `${goal.daily_target_minutes / 60}h / day`}
            </span>
          </div>
          <Timer key={goal.id} goal={goal} onSessionSave={handleSessionSave} />
        </div>
      </section>

      {/* Stats section */}
      {stats && (
        <section className={be.section}>
          <div className={be.sectionHead}>
            <div className={be.sectionIcon}>
              <BarChart2 size={20} strokeWidth={1.75} />
            </div>
            <div className={be.sectionHeadText}>
              <p className={be.sectionKicker}>Progress</p>
              <h2 className={be.sectionTitle}>At a glance</h2>
              <p className={be.sectionLead}>Your streak, total sessions, and minutes tracked.</p>
            </div>
          </div>
          <GoalStats stats={stats} />
        </section>
      )}

      {/* Analytics section */}
      {analytics && (
        <section className={be.section}>
          <div className={be.sectionHead}>
            <div className={be.sectionIcon}>
              <CalendarDays size={20} strokeWidth={1.75} />
            </div>
            <div className={be.sectionHeadText}>
              <p className={be.sectionKicker}>Analytics</p>
              <h2 className={be.sectionTitle}>Learning insights</h2>
              <p className={be.sectionLead}>Weekly and monthly breakdowns, completion rates, and your best days.</p>
            </div>
          </div>
          <LearningAnalytics analytics={analytics} />
          <LearningHeatmap heatmap={analytics.heatmap} />
        </section>
      )}

      {/* History section */}
      <section className={be.section}>
        <div className={be.sectionHead}>
          <div className={be.sectionIcon}>
            <History size={20} strokeWidth={1.75} />
          </div>
          <div className={be.sectionHeadText}>
            <p className={be.sectionKicker}>Timeline</p>
            <h2 className={be.sectionTitle}>Session history</h2>
            <p className={be.sectionLead}>All recorded study sessions for this goal.</p>
          </div>
        </div>
        {loading && !sessions.length ? (
          <p className={styles.loadingText}>Loading sessions…</p>
        ) : (
          <SessionHistory
            sessions={sessions}
            hasMore={hasMoreSessions}
            onLoadMore={loadMoreSessions}
          />
        )}
      </section>
    </div>
  );
}
