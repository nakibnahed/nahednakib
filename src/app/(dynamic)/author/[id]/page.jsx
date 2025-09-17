"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { supabase } from "@/services/supabaseClient";
import { calculateReadTime, formatReadTime } from "@/lib/utils/readTime";
import { Eye } from "lucide-react";

export default function AuthorPage({ params }) {
  const [author, setAuthor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Unwrap params outside of try/catch
  const { id } = params;

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch author profile
        const { data: authorData, error: authorError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, first_name, last_name, avatar_url, email, role, bio, professional_role"
          )
          .eq("id", id)
          .single();

        if (authorError || !authorData) {
          setError("Author not found");
          setLoading(false);
          return;
        }

        setAuthor(authorData);

        // Fetch author's blog posts
        const { data: authorPosts, error: postsError } = await supabase
          .from("blogs")
          .select(
            `
            *,
            categories (
              id,
              name,
              slug,
              color
            )
          `
          )
          .eq("author_id", id)
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Error fetching author posts:", postsError);
        }

        setPosts(authorPosts || []);
        setLoading(false);
      } catch (err) {
        setError("Error loading author data");
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading author...</div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className={styles.container}>
        <h1>Author Not Found</h1>
        <p>The author you're looking for doesn't exist.</p>
        <Link href="/blog" className={styles.backLink}>
          ← Back to Blog
        </Link>
      </div>
    );
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Blog Views Component (same as blog page)
  function BlogViews({ blogId }) {
    // Generate random numbers for views only
    const randomViews = Math.floor(Math.random() * 500) + 50; // 50-550 views

    return (
      <div className={styles.icon}>
        <Eye size={20} strokeWidth={2} />
        <span className={styles.iconText}>{randomViews}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Author Header */}
      <section className={styles.authorHeader}>
        <div className={styles.authorInfo}>
          <Image
            src={author.avatar_url || "/images/me.jpg"}
            alt={author.full_name || "Author"}
            width={120}
            height={120}
            className={styles.authorAvatar}
          />
          <div className={styles.authorDetails}>
            <h1 className={styles.authorName}>
              {author.full_name ||
                `${author.first_name} ${author.last_name}` ||
                "Author"}
            </h1>
            <p className={styles.authorBio}>
              {author.bio ||
                (author.role === "admin"
                  ? "Founder & CEO with a passion for web development and creating amazing digital experiences."
                  : "Passionate writer and developer sharing insights about technology and web development.")}
            </p>
            <div className={styles.authorStats}>
              <span className={styles.stat}>
                <strong>{posts.length}</strong> posts
              </span>
              <span className={styles.stat}>
                <strong>
                  {author.professional_role || author.role || "Author"}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Author's Posts */}
      <section className={styles.postsSection}>
        <h2 className={styles.sectionTitle}>
          Posts by {author.full_name || author.first_name || "Author"}
        </h2>

        {posts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No posts published yet.</p>
          </div>
        ) : (
          <div className={styles.gridContainer}>
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className={styles.post}
              >
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
                      <BlogViews blogId={post.id} />
                      <h1 className={styles.title}>{post.title}</h1>
                      <p className={styles.date}>
                        {formatDate(post.created_at)}
                      </p>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.technologies}>
                        {post.categories && (
                          <span className={styles.techTag}>
                            {post.categories.name}
                          </span>
                        )}
                        <span className={styles.techTag}>
                          {formatReadTime(calculateReadTime(post.content))}
                        </span>
                      </div>
                      <p className={styles.description}>
                        {post.description || "Read this amazing blog post..."}
                      </p>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.readMore}>
                        <span>Read More</span>
                        <span className={styles.arrow}>→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Back to Blog Link */}
      <div className={styles.backSection}>
        <Link href="/blog" className={styles.backLink}>
          ← Back to Blog
        </Link>
      </div>
    </div>
  );
}
