"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Timer, Trash2, Plus, BookOpen, Code2, Music, Languages, FlaskConical, Palette, Flame, Pencil, Pin, PinOff } from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "./GoalList.module.css";

const LS_PINNED = "lt_pinned_goals";

function loadPinned() {
  try {
    const raw = localStorage.getItem(LS_PINNED);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePinned(ids) {
  try { localStorage.setItem(LS_PINNED, JSON.stringify(ids)); } catch { /* ignore */ }
}

const ICON_MAP = {
  book: BookOpen,
  code: Code2,
  music: Music,
  language: Languages,
  science: FlaskConical,
  art: Palette,
};

function GoalIcon({ icon }) {
  const Icon = ICON_MAP[icon] || BookOpen;
  return <Icon size={16} strokeWidth={1.75} />;
}

function targetLabel(minutes) {
  if (minutes < 60) return `${minutes}m / day`;
  return `${minutes / 60}h / day`;
}

export default function GoalList({ goals, selectedGoalId, onSelect, onNew, onArchive, onEdit, statsMap }) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(() => loadPinned());

  const pendingGoal = goals.find((g) => g.id === pendingDeleteId);

  function handleDeleteClick(e, id) {
    e.stopPropagation();
    setPendingDeleteId(id);
  }

  function handleEditClick(e, goal) {
    e.stopPropagation();
    onEdit?.(goal);
  }

  function handlePinClick(e, id) {
    e.stopPropagation();
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [id, ...prev];
      savePinned(next);
      return next;
    });
  }

  function confirmDelete() {
    if (pendingDeleteId) onArchive(pendingDeleteId);
    setPendingDeleteId(null);
  }

  const sortedGoals = [...goals].sort((a, b) => {
    const aPin = pinnedIds.includes(a.id);
    const bPin = pinnedIds.includes(b.id);
    if (aPin === bPin) return 0;
    return aPin ? -1 : 1;
  });

  if (!goals.length) {
    return (
      <div className={styles.emptyWrap}>
        <div className={styles.emptyIcon}><Timer size={32} strokeWidth={1.5} /></div>
        <p className={styles.emptyText}>No learning goals yet</p>
        <p className={styles.emptySub}>Create your first goal to start tracking.</p>
        <button type="button" className={admin.btnPrimary} onClick={onNew} style={{ marginTop: "0.75rem", fontSize: "0.875rem", padding: "10px 20px" }}>
          <Plus size={15} /> New goal
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.listWrap}>

        <ul className={styles.list}>
          {sortedGoals.map((goal) => {
            const isActive = goal.id === selectedGoalId;
            const isPinned = pinnedIds.includes(goal.id);
            const streak = statsMap?.[goal.id]?.streak ?? 0;
            return (
              <li key={goal.id} className={`${styles.item} ${isActive ? styles.itemActive : ""} ${isPinned ? styles.itemPinned : ""} ${styles[`color-${goal.color}`]}`}>
                <button type="button" className={styles.itemBtn} onClick={() => onSelect(goal.id)}>
                  <span className={styles.itemDot} />
                  <GoalIcon icon={goal.icon} />
                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{goal.title}</span>
                    <span className={styles.itemMeta}>{targetLabel(goal.daily_target_minutes)}</span>
                  </span>
                  {streak > 0 && (
                    <span className={styles.streakBadge}>
                      <Flame size={11} />
                      {streak}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className={`${styles.pinBtn} ${isPinned ? styles.pinBtnActive : ""}`}
                  onClick={(e) => handlePinClick(e, goal.id)}
                  aria-label={isPinned ? `Unpin ${goal.title}` : `Pin ${goal.title}`}
                  title={isPinned ? "Unpin" : "Pin to top"}
                >
                  {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={(e) => handleEditClick(e, goal)}
                  aria-label={`Edit ${goal.title}`}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className={styles.archiveBtn}
                  onClick={(e) => handleDeleteClick(e, goal.id)}
                  aria-label={`Delete ${goal.title}`}
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {pendingDeleteId && typeof document !== "undefined" && createPortal(
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>
              Delete <strong>&quot;{pendingGoal?.title}&quot;</strong>? All sessions will be permanently removed.
            </p>
            <div className={styles.confirmBtns}>
              <button type="button" className={styles.confirmCancel} onClick={() => setPendingDeleteId(null)}>
                Cancel
              </button>
              <button type="button" className={`${admin.btnDanger} ${styles.confirmDo}`} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
