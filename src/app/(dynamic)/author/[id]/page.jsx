import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { supabase } from "@/services/supabaseClient";

export default async function AuthorPage({ params }) {
  const { id } = await params;

  // Fetch author profile
  const { data: author, error: authorError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (authorError || !author) {
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

  const posts = authorPosts || [];

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return readTime;
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
                "Passionate writer and developer sharing insights about technology and web development."}
            </p>
            <div className={styles.authorStats}>
              <span className={styles.stat}>
                <strong>{posts.length}</strong> posts
              </span>
              <span className={styles.stat}>
                <strong>{author.role || "Author"}</strong>
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
          <div className={styles.postsGrid}>
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className={styles.postCard}
              >
                <div className={styles.postImage}>
                  <Image
                    src={post.image || "/images/portfolio.jpg"}
                    alt={post.title}
                    fill
                    className={styles.image}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className={styles.postContent}>
                  <div className={styles.postMeta}>
                    <span className={styles.postDate}>
                      {formatDate(post.created_at)}
                    </span>
                    {post.categories && (
                      <span
                        className={styles.postCategory}
                        style={{ backgroundColor: post.categories.color }}
                      >
                        {post.categories.name}
                      </span>
                    )}
                  </div>
                  <h3 className={styles.postTitle}>{post.title}</h3>
                  <p className={styles.postDescription}>
                    {post.description || "Read this amazing blog post..."}
                  </p>
                  <div className={styles.postFooter}>
                    <span className={styles.readTime}>
                      {getReadTime(post.content)} min read
                    </span>
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
