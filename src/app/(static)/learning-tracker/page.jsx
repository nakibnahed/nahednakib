"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Timer,
  Target,
  BarChart2,
  CalendarDays,
  History,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { logoFont } from "@/lib/fonts/fonts.js";
import GridBackground from "@/components/GridBackground/GridBackground";
import { useAuthSession } from "@/context/AuthSessionContext";
import styles from "./learningTracker.module.css";

const features = [
  {
    Icon: Timer,
    title: "Focused Timer",
    desc: "Pomodoro-style sessions with pause, resume and auto-recovery. Your session survives page refreshes and idle detection stops the clock after 30 minutes of inactivity.",
  },
  {
    Icon: Target,
    title: "Goal Management",
    desc: "Create colour-coded learning goals with daily minute targets. Pin your favourites, archive what is complete and keep your focus list clean.",
  },
  {
    Icon: BarChart2,
    title: "Rich Analytics",
    desc: "Weekly and monthly breakdowns, completion rates, average session length and current streaks — all updated automatically after every session.",
  },
  {
    Icon: CalendarDays,
    title: "Activity Heatmap",
    desc: "A GitHub-style heatmap gives you an instant read on your habits. See which days you showed up and where the gaps are hiding.",
  },
  {
    Icon: History,
    title: "Session History",
    desc: "Every session is logged with start time, end time and duration so you can look back, spot patterns and learn from your data.",
  },
  {
    Icon: Lock,
    title: "Fully Private",
    desc: "Your tracker lives inside your personal profile. Only you can see your goals and sessions — no sharing, no leaderboards.",
  },
];

const steps = [
  {
    number: "01",
    Icon: Target,
    title: "Create a goal",
    desc: "Name your subject, set a daily minute target and pick one of six colours to make it yours.",
  },
  {
    number: "02",
    Icon: Timer,
    title: "Start the timer",
    desc: "Hit start, close all distractions and focus. Pause whenever you need a break — the clock waits.",
  },
  {
    number: "03",
    Icon: BarChart2,
    title: "Watch progress grow",
    desc: "Streaks, heatmaps and analytics update automatically after every session you complete.",
  },
];

const cardVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 1,
    transition: { delay: i * 0.07, duration: 0.45, ease: "easeInOut" },
  }),
};

export default function LearningTrackerLanding() {
  const { isAuthenticated, initialized } = useAuthSession();

  return (
    <main className={styles.container}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <p className={styles.eyebrow}>New feature</p>
        <h1 className={`${styles.heroTitle} ${logoFont.className}`}>
          Master your learning journey
        </h1>
        <p className={styles.heroSubtitle}>
          Set focused goals, run Pomodoro-style study timers and track your
          progress with streaks, heatmaps and detailed analytics — all in one
          private dashboard built for serious learners.
        </p>
        <div className={styles.heroButtons}>
          {initialized && isAuthenticated ? (
            <Link href="/users/dashboard/tracker" className={styles.primaryBtn}>
              <span>Go to your tracker</span>
              <span className={styles.arrow}>→</span>
            </Link>
          ) : (
            <>
              <Link href="/register" className={styles.primaryBtn}>
                <span>Start tracking free</span>
                <span className={styles.arrow}>→</span>
              </Link>
              <Link href="/login?next=/users/dashboard/tracker" className={styles.secondaryBtn}>
                <span>Sign in to dashboard</span>
                <span className={styles.arrow}>→</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Features grid ── */}
      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className={`${styles.sectionHeading} ${logoFont.className}`}>
          Everything you need to stay consistent
        </h2>
        <p className={styles.sectionIntro}>
          Built around a single principle: reduce friction between you and deep
          focus. Every feature earns its place.
        </p>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className={styles.featureCard}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <div className={styles.cardIcon}>
                <f.Icon size={26} strokeWidth={1.5} />
              </div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className={`${styles.sectionHeading} ${logoFont.className}`}>
          How it works
        </h2>
        <p className={styles.sectionIntro}>
          Three steps from zero to a growing learning habit.
        </p>
        <div className={styles.stepsGrid}>
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className={styles.stepCard}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <div className={styles.stepNumber}>{step.number}</div>
              <div className={styles.cardIcon}>
                <step.Icon size={26} strokeWidth={1.5} />
              </div>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardDesc}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── What you get ── */}
      <section className={styles.listSection}>
        <div className={styles.listContent}>
          <h2 className={`${styles.listTitle} ${logoFont.className}`}>
            Everything included, nothing to configure
          </h2>
          <ul className={styles.checkList}>
            {[
              "Unlimited learning goals with colour labels",
              "Timer with idle detection and auto-recovery",
              "Daily, weekly and monthly analytics",
              "Activity heatmap and streak tracking",
              "Full session history with timestamps",
              "Works on desktop and mobile",
            ].map((item) => (
              <li key={item} className={styles.checkItem}>
                <CheckCircle2
                  size={18}
                  strokeWidth={2}
                  className={styles.checkIcon}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.listVisual} aria-hidden="true">
          <div className={styles.mockCard}>
            <div className={styles.mockTopRow}>
              <span className={styles.mockDot} style={{ background: "var(--primary-color)" }} />
              <span className={styles.mockLabel}>JavaScript</span>
            </div>
            <div className={styles.mockTimer}>25:00</div>
            <div className={styles.mockProgress}>
              <div className={styles.mockProgressFill} style={{ width: "62%" }} />
            </div>
            <div className={styles.mockMeta}>
              <span>62% of daily goal</span>
              <span>🔥 14 day streak</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className={styles.ctaSection}>
        <div className={styles.ctaGrid}>
          <GridBackground />
        </div>
        <div className={styles.ctaInner}>
          <p className={styles.ctaEyebrow}>Ready when you are</p>
          <h2 className={`${styles.ctaTitle} ${logoFont.className}`}>
            Level up your learning
          </h2>
          <p className={styles.ctaSubtitle}>
            Create a free account and open your tracker dashboard in under a
            minute. No setup, no subscription, no noise.
          </p>
          <div className={styles.ctaBlock}>
            {initialized && isAuthenticated ? (
              <Link href="/users/dashboard/tracker" className={styles.primaryBtn}>
                <span>Go to your tracker</span>
                <span className={styles.arrow}>→</span>
              </Link>
            ) : (
              <>
                <Link href="/register" className={styles.primaryBtn}>
                  <span>Create free account</span>
                  <span className={styles.arrow}>→</span>
                </Link>
                <Link href="/login?next=/users/dashboard/tracker" className={styles.secondaryBtn}>
                  <span>Already have an account?</span>
                  <span className={styles.arrow}>→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

    </main>
  );
}
