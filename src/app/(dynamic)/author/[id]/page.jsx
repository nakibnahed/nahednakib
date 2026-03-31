"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";
import { supabase } from "@/services/supabaseClient";
import { calculateReadTime, formatReadTime } from "@/lib/utils/readTime";
import { Eye } from "lucide-react";

function supabaseErrText(err) {
  if (!err || typeof err !== "object") return String(err);
  return (
    [err.message, err.details, err.hint, err.code].filter(Boolean).join(" | ") ||
    JSON.stringify(err)
  );
}

export default function AuthorPage() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: authorData, error: authorError } = await supabase
          .from("authors")
          .select("id, name, bio, role, avatar_url, created_at, updated_at")
          .eq("id", id)
          .single();

        if (authorError || !authorData) {
          setError("Author not found");
          setLoading(false);
          return;
        }

        setAuthor(authorData);

        // Do not filter by `published` here: many schemas have no `blogs.published`
        // column (matches public /blog listing, which loads all rows).
        const withCategories = await supabase
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
          `,
          )
          .eq("author_id", id)
          .order("created_at", { ascending: false });

        let authorPosts = withCategories.data;
        const postsError = withCategories.error;

        if (postsError) {
          const noEmbed = await supabase
            .from("blogs")
            .select("*")
            .eq("author_id", id)
            .order("created_at", { ascending: false });
          if (!noEmbed.error) {
            authorPosts = noEmbed.data;
          } else {
            console.error(
              "Error fetching author posts:",
              supabaseErrText(postsError),
              "| fallback:",
              supabaseErrText(noEmbed.error),
            );
          }
        }

        setPosts(authorPosts || []);
        setLoading(false);
      } catch (err) {
        setError("Error loading author data");
        setLoading(false);
      }
    }

    if (!id) {
      setLoading(false);
      setError("Author not found");
      return;
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

  function excerptFromHtml(html) {
    if (!html || typeof html !== "string") return "";
    const text = html.replace(/<[^>]*>/g, "").trim();
    return text.length > 180 ? `${text.slice(0, 177)}…` : text;
  }

  function BlogViews() {
    const randomViews = Math.floor(Math.random() * 500) + 50;
    return (
      <div className={styles.icon}>
        <Eye size={20} strokeWidth={2} />
        <span className={styles.iconText}>{randomViews}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.authorHeader}>
        <div className={styles.authorInfo}>
          <Image
            src={author.avatar_url || "/images/me.jpg"}
            alt={author.name || "Author"}
            width={120}
            height={120}
            className={styles.authorAvatar}
          />
          <div className={styles.authorDetails}>
            <h1 className={styles.authorName}>{author.name}</h1>
            {author.role?.trim() ? (
              <p className={styles.authorRoleLine}>{author.role.trim()}</p>
            ) : null}
            <p className={styles.authorBio}>
              {author.bio ||
                "Writer and developer sharing insights about technology and web development."}
            </p>
            <div className={styles.authorStats}>
              <span className={styles.stat}>
                <strong>{posts.length}</strong> posts
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.postsSection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleText}> Posts by</span>{" "}
          {author.name}
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
                      <BlogViews />
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
                        {post.description?.trim() ||
                          excerptFromHtml(post.content) ||
                          "Read this blog post…"}
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

      <div className={styles.backSection}>
        <Link href="/blog" className={styles.backLink}>
          ← Back to Blog
        </Link>
      </div>
    </div>
  );
}
