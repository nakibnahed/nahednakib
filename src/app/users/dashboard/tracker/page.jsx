"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Target, BookOpen } from "lucide-react";
import { showAppToast } from "@/lib/showAppToast";
import GoalList from "@/components/LearningTracker/GoalList";
import GoalDetail from "@/components/LearningTracker/GoalDetail";
import GoalForm from "@/components/LearningTracker/GoalForm";
import be from "@/app/admin/blogs/BlogEditor.module.css";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "./tracker.module.css";

export default function TrackerPage() {
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsMap, setStatsMap] = useState({});

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/learning/goals");
      if (!res.ok) { showAppToast("Could not load goals", "error"); return; }
      const { goals: data } = await res.json();
      setGoals(data || []);
      if (data?.length && !selectedGoalId) setSelectedGoalId(data[0].id);
    } catch {
      showAppToast("Could not load goals", "error");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  async function createGoal(data) {
    const res = await fetch("/api/learning/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      showAppToast(error || "Could not create goal", "error");
      return;
    }
    const { goal } = await res.json();
    setGoals((prev) => [goal, ...prev]);
    setSelectedGoalId(goal.id);
    setGoalFormOpen(false);
    showAppToast("Goal created!", "success");
  }

  async function updateGoal(data) {
    if (!editingGoal) return;
    const res = await fetch(`/api/learning/goals/${editingGoal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      showAppToast(error || "Could not update goal", "error");
      return;
    }
    const { goal } = await res.json();
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    setGoalFormOpen(false);
    setEditingGoal(null);
    showAppToast("Goal updated!", "success");
  }

  async function archiveGoal(id) {
    const res = await fetch(`/api/learning/goals/${id}`, { method: "DELETE" });
    if (!res.ok) { showAppToast("Could not archive goal", "error"); return; }
    setGoals((prev) => {
      const remaining = prev.filter((g) => g.id !== id);
      if (selectedGoalId === id) setSelectedGoalId(remaining[0]?.id ?? null);
      return remaining;
    });
    showAppToast("Goal removed", "success");
  }

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null;

  return (
    <div className={be.pageRoot}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <span className={styles.heroChip}>Study Sessions</span>
        </div>
        <div className={styles.heroTitleRow}>
          <div className={styles.heroIcon}><BookOpen size={17} strokeWidth={1.75} /></div>
          <h1 className={styles.heroTitle}>Learning Tracker</h1>
        </div>
        <p className={styles.heroLead}>Track your daily study sessions across multiple learning goals.</p>
      </header>

      {loading ? (
        <div className={be.formFlow}>
          <p className={styles.loadingText}>Loading your goals…</p>
        </div>
      ) : (
        <div className={`${be.formFlow} ${styles.trackerLayout}`}>
          <aside className={styles.goalListColumn}>
            <div className={styles.goalListSection}>
              <div className={be.sectionHead}>
                <div className={be.sectionIcon}>
                  <Target size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Goals</p>
                  <h2 className={be.sectionTitle}>Your goals</h2>
                </div>
                <button
                  type="button"
                  className={styles.newGoalBtn}
                  onClick={() => { setEditingGoal(null); setGoalFormOpen(true); }}
                  aria-label="New goal"
                >
                  <Plus size={15} />
                </button>
              </div>
              <div className={styles.goalListCard}>
                <div className={styles.goalListCardInner}>
                  <GoalList
                    goals={goals}
                    selectedGoalId={selectedGoalId}
                    onSelect={setSelectedGoalId}
                    onNew={() => { setEditingGoal(null); setGoalFormOpen(true); }}
                    onArchive={archiveGoal}
                    onEdit={(goal) => { setEditingGoal(goal); setGoalFormOpen(true); }}
                    statsMap={statsMap}
                  />
                </div>
              </div>
            </div>
          </aside>

          <div className={styles.detailColumn}>
            {selectedGoal ? (
              <GoalDetail goal={selectedGoal} />
            ) : (
              <div className={admin.emptyPanel}>
                <p>No goals yet.</p>
                <button type="button" className={`${admin.btnPrimary} ${styles.emptyNewBtn}`} onClick={() => setGoalFormOpen(true)}>
                  <Plus size={15} /> Create your first goal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {goalFormOpen && (
        <GoalForm
          initialData={editingGoal}
          onSubmit={editingGoal ? updateGoal : createGoal}
          onClose={() => { setGoalFormOpen(false); setEditingGoal(null); }}
        />
      )}
    </div>
  );
}
