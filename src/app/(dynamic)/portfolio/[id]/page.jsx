import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import ActionBar from "@/components/ActionBar/ActionBar";
import EngagementSection from "@/components/EngagementSection/EngagementSection";
import ViewTracker from "./ViewTracker";
import {
  FaEye,
  FaHeart,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaFolder,
  FaCalendar,
  FaCheckCircle,
  FaUser,
  FaCode,
  FaExternalLinkAlt,
  FaGlobe,
  FaArrowRight,
} from "react-icons/fa";
import PostBoxCard from "@/components/InfoCard/PostBoxCard";
import { FileText, MessageSquare, Trophy, Key, Briefcase } from "lucide-react";

function formatDate(dateString) {
  if (!dateString) return "Recent";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recent";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDefaultTechnologies(category) {
  switch (category?.toLowerCase()) {
    case "web development":
      return ["React", "Next.js", "Supabase", "Tailwind CSS", "Node.js"];
    case "backend":
      return ["Node.js", "Express", "PostgreSQL", "Redis", "Docker"];
    case "full stack":
      return ["React", "Node.js", "PostgreSQL", "TypeScript", "AWS"];
    case "mobile":
      return ["React Native", "Redux", "Firebase", "TypeScript"];
    case "ui/ux":
      return ["Figma", "Adobe XD", "Sketch", "Principle"];
    default:
      return ["React", "Next.js", "Node.js", "Tailwind CSS"];
  }
}

export default async function PortfolioPage({ params }) {
  const actualParams = await params;
  const { id } = actualParams;

  const { data: portfolio, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return <p>Error: {error.message}</p>;
  if (!portfolio) return <p>Not found</p>;

  // Get technologies from the database or use defaults based on category
  const technologies = portfolio.technologies
    ? portfolio.technologies.split(",").map((tech) => tech.trim())
    : [];

  return (
    <div className={styles.pageContainer}>
      <ViewTracker portfolioId={id} />

      <div className={styles.sectionsGrid}>
        <section className={styles.heroSection}>
          <section className={styles.hero}>
            <img
              src={portfolio.image || "/images/portfolio.jpg"}
              alt={portfolio.title}
              className={styles.heroImage}
            />
            <div className={styles.heroOverlay}></div>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>{portfolio.title}</h1>
              <div className={styles.breadcrumb}>
                <a className={styles.link} href="/">
                  Home
                </a>
                <span className={styles.separator}>/</span>
                <a className={styles.link} href="/portfolio">
                  Portfolio
                </a>
                <span className={styles.separator}>/</span>
                <span className={styles.current}>{portfolio.title}</span>
              </div>
            </div>
          </section>
        </section>
        <div className={styles.projectOverviewSection}>
          <PostBoxCard title="Project Overview" Icon={FileText}>
            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{ __html: portfolio.overview || "" }}
            />
          </PostBoxCard>
        </div>
        <div className={styles.projectInfoSection}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>
              <Briefcase className={styles.titleIcon} size={20} />
              Project Info
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  <FaFolder className={styles.coloredIcon} />
                  Category
                </span>
                <span className={styles.infoValue}>{portfolio.category}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  <FaCalendar className={styles.coloredIcon} />
                  Date
                </span>
                <span className={styles.infoValue}>
                  {formatDate(portfolio.created_at)}
                </span>
              </div>
              {portfolio.client && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <FaUser className={styles.coloredIcon} />
                    Client
                  </span>
                  <span className={styles.infoValue}>{portfolio.client}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  <FaCheckCircle className={styles.coloredIcon} />
                  Status
                </span>
                <span className={styles.infoValue}>
                  {portfolio.status || "Completed"}
                </span>
              </div>
            </div>

            <div className={styles.techStack}>
              <h4 className={styles.techTitle}>
                <FaCode className={styles.coloredIcon} />
                Technologies
              </h4>
              <div className={styles.techTags}>
                {technologies.map((tech, index) => (
                  <span key={index} className={styles.techTag}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <ActionBar
                title={portfolio.title}
                contentType="portfolio"
                contentId={portfolio.id}
              />
            </div>
          </div>
        </div>
        {portfolio.achievements && portfolio.achievements.trim() && (
          <div className={styles.achievementsSection}>
            <PostBoxCard title="Achievements" Icon={Trophy}>
              <div
                className={styles.prose}
                dangerouslySetInnerHTML={{ __html: portfolio.achievements }}
              />
            </PostBoxCard>
          </div>
        )}
        {(portfolio.live_url && portfolio.live_url.trim()) ||
        (portfolio.repo_url && portfolio.repo_url.trim()) ? (
          <div className={styles.linksSection}>
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Links</h3>
              <div className={styles.linkButtons}>
                {portfolio.live_url && portfolio.live_url.trim() && (
                  <a
                    href={portfolio.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkButton}
                  >
                    <FaGlobe className={styles.coloredIcon} />
                    Live Website
                  </a>
                )}
                {portfolio.repo_url && portfolio.repo_url.trim() && (
                  <a
                    href={portfolio.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkButton}
                  >
                    <FaArrowRight className={styles.coloredIcon} />
                    Visit Repo
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : null}
        {portfolio.key_features && portfolio.key_features.trim() && (
          <div className={styles.keyFeaturesSection}>
            <PostBoxCard title="Key Features" Icon={Key}>
              <div
                className={styles.prose}
                dangerouslySetInnerHTML={{ __html: portfolio.key_features }}
              />
            </PostBoxCard>
          </div>
        )}
        <div className={styles.engagementSection}>
          <EngagementSection contentId={portfolio.id} contentType="portfolio" />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: portfolio?.title
      ? `${portfolio.title} | Nahed`
      : "Portfolio Project | Nahed",
  };
}
