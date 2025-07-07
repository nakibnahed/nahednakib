"use client";

import Link from "next/link";
import styles from "../../app/(dynamic)/portfolio/page.module.css";
import PortfolioStats, {
  EngagementStats,
} from "@/components/PortfolioStats/PortfolioStats";

export default function PortfolioCard({ portfolio }) {
  const date = new Date(portfolio.created_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/portfolio/${portfolio.id}`} className={styles.post}>
      <div
        className={styles.card}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
          e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
        }}
      >
        <div className={styles.cardGlow} />
        <div className={styles.cardContent}>
          <div className={styles.cardHeader}>
            <PortfolioStats portfolioId={portfolio.id} />
            <h1 className={styles.title}>{portfolio.title}</h1>
            <p className={styles.date}>{formattedDate}</p>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.technologies}>
              {(portfolio.technologies || "")
                .split(",")
                .filter((tech) => tech.trim() !== "")
                .map((tech, index) => (
                  <span key={index} className={styles.techTag}>
                    {tech.trim()}
                  </span>
                ))}
            </div>
            <p className={styles.description}>{portfolio.description}</p>
          </div>

          <div className={styles.cardFooter}>
            <EngagementStats portfolioId={portfolio.id} />
            <div className={styles.readMore}>
              <span>Read More</span>
              <span className={styles.arrow}>→</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
