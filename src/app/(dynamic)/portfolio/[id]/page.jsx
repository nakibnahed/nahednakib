import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import ActionBar from "@/components/ActionBar/ActionBar";
import EngagementSection from "@/components/EngagementSection/EngagementSection";

export default async function Post({ params }) {
  // Await params if it's a Promise (Next.js 14+)
  const actualParams = await params;
  const { id } = actualParams;

  const { data: portfolio, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return <p>Error: {error.message}</p>;
  if (!portfolio) return <p>Not found</p>;

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.imageCard}>
          <Image
            src={portfolio.image || "/images/portfolio.jpg"}
            alt={portfolio.title}
            fill
            priority
            style={{ objectFit: "cover" }}
            className={styles.image}
          />
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{portfolio.title}</h1>
          {portfolio.created_at && (
            <span className={styles.publishDate}>
              {new Date(portfolio.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <span className={styles.category}>{portfolio.category}</span>
          <nav className={styles.breadcrumb}>
            <Link href="/" className={styles.link}>
              Home
            </Link>
            <span className={styles.separator}>/</span>
            <Link href="/portfolio" className={styles.link}>
              Portfolio
            </Link>
            <span className={styles.separator}>/</span>
            <span className={styles.current}>{portfolio.category}</span>
          </nav>
          <ActionBar
            title={portfolio.title}
            contentType="portfolio"
            contentId={portfolio.id}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.content}>
        <div
          className={styles.prose}
          dangerouslySetInnerHTML={{ __html: portfolio.content }}
        />
      </main>

      {/* Engagement Section */}
      <section id="comments-section" className={styles.engagementWrapper}>
        <EngagementSection
          contentType="portfolio"
          contentId={portfolio.id}
          title={portfolio.title}
        />
      </section>
    </div>
  );
}
