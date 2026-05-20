"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, RotateCcw, Pause, AlertTriangle } from "lucide-react";
import { showAppToast } from "@/lib/showAppToast";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "./Timer.module.css";

const LS_GOAL_ID = "lt_active_goalId";
const LS_STARTED_AT = "lt_active_startedAt";
const LS_PAUSED_MS = "lt_active_pausedMs";
const LS_RUNNING = "lt_active_running";
const MAX_MS = 6 * 3600 * 1000;
const IDLE_THRESHOLD_MS = 30 * 60 * 1000;

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export default function Timer({ goal, onSessionSave }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [idlePrompt, setIdlePrompt] = useState(null);
  const [autoStopWarning, setAutoStopWarning] = useState(false);

  const startedAtRef = useRef(null);
  const pausedMsRef = useRef(0);
  const pauseStartRef = useRef(null);
  const intervalRef = useRef(null);
  const hiddenAtRef = useRef(null);

  const targetMs = goal.daily_target_minutes * 60 * 1000;

  const clearLs = useCallback(() => {
    localStorage.removeItem(LS_GOAL_ID);
    localStorage.removeItem(LS_STARTED_AT);
    localStorage.removeItem(LS_PAUSED_MS);
    localStorage.removeItem(LS_RUNNING);
  }, []);

  const writeLs = useCallback((isRunning) => {
    try {
      localStorage.setItem(LS_GOAL_ID, goal.id);
      if (startedAtRef.current) localStorage.setItem(LS_STARTED_AT, startedAtRef.current.toISOString());
      localStorage.setItem(LS_PAUSED_MS, String(pausedMsRef.current));
      localStorage.setItem(LS_RUNNING, isRunning ? "true" : "false");
    } catch { /* ignore */ }
  }, [goal.id]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const ms = Date.now() - startedAtRef.current.getTime() - pausedMsRef.current;
      setElapsedMs(ms);
      if (ms >= MAX_MS) {
        clearInterval(intervalRef.current);
        setRunning(false);
        setAutoStopWarning(true);
        writeLs(false);
      }
    }, 1000);
  }, [writeLs]);

  useEffect(() => {
    const storedGoalId = localStorage.getItem(LS_GOAL_ID);
    if (storedGoalId !== goal.id) return;
    const storedStartedAt = localStorage.getItem(LS_STARTED_AT);
    const storedPausedMs = Number(localStorage.getItem(LS_PAUSED_MS) || "0");
    const storedRunning = localStorage.getItem(LS_RUNNING) === "true";
    if (!storedStartedAt) return;
    startedAtRef.current = new Date(storedStartedAt);
    pausedMsRef.current = storedPausedMs;
    const ms = Date.now() - startedAtRef.current.getTime() - storedPausedMs;
    setElapsedMs(Math.max(0, ms));
    setRecovered(true);
    if (storedRunning) { setRunning(true); startInterval(); }
  }, [goal.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else {
        if (!hiddenAtRef.current || !running) { hiddenAtRef.current = null; return; }
        const hiddenDuration = Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
        if (hiddenDuration >= IDLE_THRESHOLD_MS) {
          setIdlePrompt({ hiddenDuration });
          clearInterval(intervalRef.current);
          setRunning(false);
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [running]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (!showReset && !idlePrompt) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [showReset, idlePrompt]);

  function handleStart() {
    if (!startedAtRef.current) startedAtRef.current = new Date();
    if (pauseStartRef.current) {
      pausedMsRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setRunning(true);
    setRecovered(false);
    setAutoStopWarning(false);
    startInterval();
    writeLs(true);
  }

  function handlePause() {
    clearInterval(intervalRef.current);
    pauseStartRef.current = Date.now();
    setRunning(false);
    writeLs(false);
  }

  async function handleStop() {
    if (!startedAtRef.current) return;
    clearInterval(intervalRef.current);
    const endedAt = new Date();
    const durationSeconds = Math.floor(elapsedMs / 1000);
    if (durationSeconds < 1) { handleReset(); return; }
    setSaving(true);
    await onSessionSave({
      goalId: goal.id,
      startedAt: startedAtRef.current.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds,
      targetMinutes: goal.daily_target_minutes,
    });
    setSaving(false);
    startedAtRef.current = null;
    pausedMsRef.current = 0;
    pauseStartRef.current = null;
    setElapsedMs(0);
    setRunning(false);
    setRecovered(false);
    clearLs();
  }

  function handleReset() {
    clearInterval(intervalRef.current);
    startedAtRef.current = null;
    pausedMsRef.current = 0;
    pauseStartRef.current = null;
    setElapsedMs(0);
    setRunning(false);
    setRecovered(false);
    setShowReset(false);
    setAutoStopWarning(false);
    clearLs();
  }

  function handleIdleYes() {
    if (idlePrompt && startedAtRef.current) { startInterval(); setRunning(true); writeLs(true); }
    setIdlePrompt(null);
  }

  function handleIdleNo() {
    if (idlePrompt && startedAtRef.current) {
      pausedMsRef.current += idlePrompt.hiddenDuration;
      const ms = Date.now() - startedAtRef.current.getTime() - pausedMsRef.current;
      setElapsedMs(Math.max(0, ms));
      startInterval();
      setRunning(true);
      writeLs(true);
    }
    setIdlePrompt(null);
  }

  const pct = Math.min((elapsedMs / targetMs) * 100, 100);
  const progressState = elapsedMs >= targetMs ? "done" : elapsedMs >= targetMs / 2 ? "warn" : "default";
  const isStarted = startedAtRef.current !== null || elapsedMs > 0;

  return (
    <div className={styles.wrap}>
      {recovered && (
        <div className={styles.recoveryBanner}>
          <AlertTriangle size={14} /> Session recovered — your time is here.
        </div>
      )}
      {autoStopWarning && (
        <div className={styles.autoStopBanner}>
          <AlertTriangle size={14} /> Timer paused after 6 hours. Please save or reset.
        </div>
      )}
      {running && <p className={styles.runningNote}>Timer running — don&apos;t close this tab.</p>}

      <div className={styles.ringWrap} style={{ "--progress": `${pct}%` }}>
        <div className={`${styles.ring} ${styles[`ring-${progressState}`]}`} />
        <div className={styles.timeBlock}>
          <span className={`${styles.timeDisplay} ${styles[`time-${progressState}`]}`}>
            {formatTime(elapsedMs)}
          </span>
          <span className={styles.targetLabel}>
            / {goal.daily_target_minutes < 60 ? `${goal.daily_target_minutes}m` : `${goal.daily_target_minutes / 60}h`}
          </span>
        </div>
      </div>

      <div className={styles.pctLabel}>{Math.round(pct)}% of daily goal</div>

      <div className={styles.controls}>
        {!running ? (
          <button type="button" className={admin.btnPrimary} onClick={handleStart} disabled={saving}>
            <Play size={15} fill="currentColor" strokeWidth={0} />
            {isStarted ? "Resume" : "Start"}
          </button>
        ) : (
          <button type="button" className={styles.pauseBtn} onClick={handlePause}>
            <Pause size={15} /> Pause
          </button>
        )}
        <button type="button" className={`${admin.btnDanger} ${styles.stopBtn}`} onClick={handleStop} disabled={!isStarted || saving}>
          <Square size={13} fill="currentColor" strokeWidth={0} />
          {saving ? "Saving…" : "Save & stop"}
        </button>
        <button type="button" className={styles.resetBtn} onClick={() => setShowReset(true)} disabled={!isStarted || saving} aria-label="Reset timer">
          <RotateCcw size={14} />
        </button>
      </div>

      {showReset && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>Reset timer? This session won&apos;t be saved.</p>
            <div className={styles.confirmBtns}>
              <button type="button" className={styles.confirmCancel} onClick={() => setShowReset(false)}>Keep going</button>
              <button type="button" className={`${admin.btnDanger} ${styles.confirmDo}`} onClick={handleReset}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {idlePrompt && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>
              You were away for {Math.round(idlePrompt.hiddenDuration / 60000)} minutes. Were you still studying?
            </p>
            <div className={styles.confirmBtns}>
              <button type="button" className={styles.confirmCancel} onClick={handleIdleNo}>No — exclude that time</button>
              <button type="button" className={admin.btnPrimary} onClick={handleIdleYes}>Yes — count it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
