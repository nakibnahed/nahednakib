"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Flag,
  Calendar,
  TrendingUp,
  Timer,
  Shield,
  Globe,
  Code2,
  LayoutDashboard,
  Gauge,
  Plug,
  Palette,
  Monitor,
  Activity,
} from "lucide-react";
import styles from "./services.module.css";
import { logoFont } from "@/lib/fonts/fonts.js";
import GridBackground from "@/components/GridBackground/GridBackground";

const runningServices = [
  {
    Icon: ClipboardList,
    title: "Custom Training Plans",
    desc: "Personalized weekly training programs built around your current fitness level, goals, and schedule — whether you're a beginner or chasing a PR.",
  },
  {
    Icon: Flag,
    title: "Race Preparation",
    desc: "Structured build-up phases tailored to your target race — 5K, 10K, half marathon, or full marathon — with periodization and taper strategy.",
  },
  {
    Icon: Calendar,
    title: "Weekly Schedule Design",
    desc: "Balanced mix of easy runs, tempo sessions, long runs, and recovery days designed to maximize adaptation without overtraining.",
  },
  {
    Icon: TrendingUp,
    title: "Progress Tracking",
    desc: "Regular check-ins and plan adjustments based on your feedback and data, keeping you on track through every phase of training.",
  },
  {
    Icon: Timer,
    title: "Pacing & Effort Zones",
    desc: "Guidance on running the right effort at the right time — heart rate zones, pace targets, and the discipline to run easy when it counts.",
  },
  {
    Icon: Shield,
    title: "Injury Prevention",
    desc: "Smart load management, recovery protocols, and training adjustments to keep you healthy, consistent, and building — not breaking down.",
  },
];

const webServices = [
  {
    Icon: Globe,
    title: "Website Building",
    desc: "Fast, modern websites built with Next.js — clean UI, full mobile responsiveness, and optimized for real-world performance from day one.",
  },
  {
    Icon: Code2,
    title: "Full-Stack Development",
    desc: "End-to-end applications with authentication, database design, API routes, and real-time features — production-ready from the ground up.",
  },
  {
    Icon: LayoutDashboard,
    title: "CMS & Admin Panels",
    desc: "Custom content management dashboards so you can update text, images, and data yourself — no code required after handoff.",
  },
  {
    Icon: Gauge,
    title: "Performance & SEO",
    desc: "Core Web Vitals tuning, metadata, structured data (JSON-LD), sitemap generation, and Lighthouse optimization for search visibility.",
  },
  {
    Icon: Plug,
    title: "API Integrations",
    desc: "Connect your site to third-party services — Stripe, Supabase, Strava, Nodemailer, OAuth providers, webhooks, and more.",
  },
  {
    Icon: Palette,
    title: "UI/UX Design",
    desc: "Clean, intentional interfaces designed for real users — component systems, responsive layouts, and interactions that feel natural.",
  },
];


const cardVariants = {
  hidden: { opacity: 0 },
  visible: (i) => ({
    opacity: 1,
    transition: { delay: i * 0.07, duration: 0.5, ease: "easeInOut" },
  }),
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("web");

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <h1 className={`${styles.heroTitle} ${logoFont.className}`}>
          What I Offer
        </h1>
        <p className={styles.heroSubtitle}>
          Two passions, two service tracks — pick the one that fits your goal.
        </p>

        {/* Tab switcher */}
        <div className={styles.tabGroup}>
          <button
            className={`${styles.tabBtn} ${activeTab === "web" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("web")}
          >
            <Monitor size={16} strokeWidth={2} />
            Web Development
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "running" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("running")}
          >
            <Activity size={16} strokeWidth={2} />
            Running Coaching
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "running" ? (
          <motion.section
            key="running"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className={styles.sectionIntro}>
              As a competitive distance runner, I understand what it takes to
              improve — consistent structure, smart progression, and honest
              feedback. I offer coaching grounded in real training experience,
              not just theory.
            </p>

            <div className={styles.servicesGrid}>
              {runningServices.map((s, i) => (
                <motion.div
                  key={s.title}
                  className={styles.serviceCard}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  <div className={styles.cardIcon}><s.Icon size={28} strokeWidth={1.5} /></div>
                  <h3 className={styles.cardTitle}>{s.title}</h3>
                  <p className={styles.cardDesc}>{s.desc}</p>
                </motion.div>
              ))}
            </div>

          </motion.section>
        ) : (
          <motion.section
            key="web"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p className={styles.sectionIntro}>
              I build modern, production-grade websites and web applications —
              focusing on performance, clean code, and an experience users
              actually enjoy. Every project is custom, not a template.
            </p>

            <div className={styles.servicesGrid}>
              {webServices.map((s, i) => (
                <motion.div
                  key={s.title}
                  className={styles.serviceCard}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  <div className={styles.cardIcon}><s.Icon size={28} strokeWidth={1.5} /></div>
                  <h3 className={styles.cardTitle}>{s.title}</h3>
                  <p className={styles.cardDesc}>{s.desc}</p>
                </motion.div>
              ))}
            </div>

          </motion.section>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <div className={styles.ctaSection}>
        <div className={styles.ctaGrid}>
          <GridBackground />
        </div>
        <div className={styles.ctaInner}>
          {activeTab === "web" ? (
            <>
              <p className={styles.ctaEyebrow}>Ready when you are</p>
              <h2 className={`${styles.ctaTitle} ${logoFont.className}`}>
                Let&apos;s Build Something
              </h2>
              <p className={styles.ctaSubtitle}>
                Have a project in mind? Whether it&apos;s a new website, a
                full-stack app, or something in between — let&apos;s talk and
                make it happen.
              </p>
              <div className={styles.ctaBlock}>
                <Link href="/services/start-project" className={styles.ctaButton}>
                  <span>Start a Project</span>
                  <span className={styles.arrow}>→</span>
                </Link>
                <Link href="/portfolio" className={styles.ctaSecondary}>
                  <span>View Portfolio</span>
                  <span className={styles.arrow}>→</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className={styles.ctaEyebrow}>Ready to start training</p>
              <h2 className={`${styles.ctaTitle} ${logoFont.className}`}>
                Let&apos;s Build Your Plan
              </h2>
              <p className={styles.ctaSubtitle}>
                Tell me your goal — your current level, your target race, your
                schedule — and I&apos;ll put together a plan that actually fits
                your life.
              </p>
              <div className={styles.ctaBlock}>
                <Link href="/contact" className={styles.ctaButton}>
                  <span>Get in Touch</span>
                  <span className={styles.arrow}>→</span>
                </Link>
                <Link href="/info" className={styles.ctaSecondary}>
                  <span>See My Training</span>
                  <span className={styles.arrow}>→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
