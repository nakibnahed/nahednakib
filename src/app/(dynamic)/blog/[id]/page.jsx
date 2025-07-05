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

  // Fetch from 'blogs' table instead of 'portfolios'
  const { data: blog, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return <p>Error: {error.message}</p>;
  if (!blog) return <p>Not found</p>;

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.imageCard}>
          <Image
            src={blog.image || "/images/portfolio.jpg"}
            alt={blog.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            className={styles.image}
          />
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{blog.title}</h1>
          {blog.created_at && (
            <span className={styles.publishDate}>
              {new Date(blog.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <span className={styles.category}>{blog.category}</span>
          <nav className={styles.breadcrumb}>
            <Link href="/" className={styles.link}>
              Home
            </Link>
            <span className={styles.separator}>/</span>
            <Link href="/blog" className={styles.link}>
              Blog
            </Link>
            <span className={styles.separator}>/</span>
            <span className={styles.current}>{blog.category}</span>
          </nav>
          <ActionBar
            title={blog.title}
            contentType="blog"
            contentId={blog.id}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.content}>
        <div
          className={styles.prose}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </main>

      {/* Engagement Section */}
      <section id="comments-section" className={styles.engagementWrapper}>
        <EngagementSection
          contentType="blog"
          contentId={blog.id}
          title={blog.title}
        />
      </section>
    </div>
  );
}
