import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import ActionBar from "@/components/ActionBar/ActionBar";
import EngagementSection from "@/components/EngagementSection/EngagementSection";
import { supabase } from "@/services/supabaseClient";

export default async function Post({ params }) {
  const { id } = params;
  const { data: blog, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return <p>Error: {error.message}</p>;
  if (!blog) return <p>Not found</p>;

  const formattedDate = new Date(blog.created_at).toLocaleDateString(
    undefined,
    { year: "numeric", month: "short", day: "numeric" }
  );
  const tags =
    blog.tags && blog.tags.trim()
      ? blog.tags.split(",").map((t) => t.trim())
      : ["Demo", "Blog", "Next.js", "Supabase"];

  return (
    <div className={styles.container}>
      <section className={styles.metaSection}>
        <div className={styles.breadcrumbRow}>
          <Link href="/blog" className={styles.breadcrumbLink}>
            Blog
          </Link>
          <span className={styles.date}>{formattedDate}</span>
        </div>
        <h1 className={styles.title}>{blog.title}</h1>
        <div className={styles.authorRow}>
          <Image
            src={blog.authorAvatar || "/images/me.jpg"}
            alt={blog.author || "Author"}
            width={40}
            height={40}
            className={styles.authorAvatar}
          />
          <div>
            <div className={styles.author}>{blog.author || "Nahed Nakib"}</div>
            <div className={styles.authorRole}>
              {blog.authorRole || "Founder & CEO"}
            </div>
          </div>
        </div>
        <div className={styles.tagsRow}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className={styles.metaRow2}>
          <span className={styles.readTime}>
            {blog.readTime || "8 minute read"}
          </span>
        </div>
        <ActionBar title={blog.title} contentType="blog" contentId={blog.id} />
      </section>
      <div className={styles.featuredImageWrapper}>
        <Image
          src={blog.image || "/images/portfolio.jpg"}
          alt={blog.title}
          fill
          priority
          className={styles.featuredImage}
          style={{ objectFit: "cover" }}
        />
      </div>
      <main className={styles.content}>
        <div
          className={styles.prose}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </main>
      <EngagementSection
        contentType="blog"
        contentId={blog.id}
        title={blog.title}
        id="comments-section"
      />
      <section className={styles.relatedSection}>
        <h2>Related Posts</h2>
        <ul className={styles.relatedList}>
          <li>
            <Link className={styles.relatedListItem} href="/blog/demo-1">
              <img
                className={styles.relatedPostThumb}
                src="/images/portfolio.jpg"
                alt="Demo 1"
              />
              <div className={styles.relatedPostInfo}>
                <span className={styles.relatedPostTitle}>
                  How to Build a Portfolio with Next.js
                </span>
                <span className={styles.relatedPostDesc}>
                  A step-by-step guide to building a modern portfolio using
                  Next.js and Supabase.
                </span>
              </div>
              <span className={styles.relatedReadMore}>
                Read More <span className={styles.arrow}>→</span>
              </span>
            </Link>
          </li>
          <li>
            <Link className={styles.relatedListItem} href="/blog/demo-2">
              <img
                className={styles.relatedPostThumb}
                src="/images/portfolio.jpg"
                alt="Demo 2"
              />
              <div className={styles.relatedPostInfo}>
                <span className={styles.relatedPostTitle}>
                  Styling Tips for Modern Web Apps
                </span>
                <span className={styles.relatedPostDesc}>
                  Best practices for clean, responsive, and beautiful web app
                  UIs.
                </span>
              </div>
              <span className={styles.relatedReadMore}>
                Read More <span className={styles.arrow}>→</span>
              </span>
            </Link>
          </li>
          <li>
            <Link className={styles.relatedListItem} href="/blog/demo-3">
              <img
                className={styles.relatedPostThumb}
                src="/images/portfolio.jpg"
                alt="Demo 3"
              />
              <div className={styles.relatedPostInfo}>
                <span className={styles.relatedPostTitle}>
                  Deploying with Supabase & Vercel
                </span>
                <span className={styles.relatedPostDesc}>
                  Learn how to deploy your Next.js app with a Supabase backend
                  on Vercel.
                </span>
              </div>
              <span className={styles.relatedReadMore}>
                Read More <span className={styles.arrow}>→</span>
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
