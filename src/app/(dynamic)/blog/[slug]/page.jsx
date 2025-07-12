import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import ActionBar from "@/components/ActionBar/ActionBar";
import EngagementSection from "@/components/EngagementSection/EngagementSection";
import { supabase } from "@/services/supabaseClient";

export default async function Post({ params }) {
  const { slug } = await params;

  const { data: blog, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      profiles!blogs_author_id_fkey (
        id,
        full_name,
        first_name,
        last_name,
        avatar_url,
        email,
        bio
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Database error:", error);
    return (
      <div className={styles.container}>
        <h1>Error Loading Blog Post</h1>
        <p>
          Sorry, there was an error loading this blog post. Please try again.
        </p>
        <Link href="/blog" className={styles.breadcrumbLink}>
          ← Back to Blog
        </Link>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className={styles.container}>
        <h1>Blog Post Not Found</h1>
        <p>The blog post you're looking for doesn't exist or has been moved.</p>
        <Link href="/blog" className={styles.breadcrumbLink}>
          ← Back to Blog
        </Link>
      </div>
    );
  }

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
          <Link
            href={`/author/${blog.profiles?.id || "default"}`}
            className={styles.authorLink}
          >
            <Image
              src={blog.profiles?.avatar_url || "/images/me.jpg"}
              alt={blog.profiles?.full_name || "Author"}
              width={40}
              height={40}
              className={styles.authorAvatar}
            />
            <div>
              <div className={styles.author}>
                {blog.profiles?.full_name ||
                  blog.profiles?.first_name + " " + blog.profiles?.last_name ||
                  "Nahed Nakib"}
              </div>
              <div className={styles.authorRole}>
                {blog.profiles?.bio || "Founder & CEO"}
              </div>
            </div>
          </Link>
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
