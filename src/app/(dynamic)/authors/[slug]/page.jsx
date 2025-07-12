import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { supabase } from "@/services/supabaseClient";

export default async function AuthorPage({ params }) {
  const { slug } = await params;

  // Fetch author data from profiles table
  const { data: author, error: authorError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", slug)
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
  const { data: posts, error: postsError } = await supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      slug,
      description,
      image,
      date,
      categories (
        name,
        color
      )
    `
    )
    .eq("author_user_id", author.id)
    .order("date", { ascending: false });

  if (postsError) {
    console.error("Error fetching posts:", postsError);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className={styles.container}>
      {/* Author Header */}
      <section className={styles.authorHeader}>
        <div className={styles.authorInfo}>
          <div className={styles.avatarWrapper}>
            <Image
              src={author.avatar_url || "/images/me.jpg"}
              alt={author.name}
              width={120}
              height={120}
              className={styles.avatar}
            />
          </div>
          <div className={styles.authorDetails}>
            <h1 className={styles.authorName}>{author.full_name}</h1>
            <p className={styles.authorRole}>
              {author.role === "admin" ? "Founder & CEO" : author.role}
            </p>
            <p className={styles.authorBio}>
              {author.bio || "No bio available yet."}
            </p>

            {/* Social Links */}
            <div className={styles.socialLinks}>
              {author.website && (
                <a
                  href={author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  🌐 Website
                </a>
              )}
              {author.twitter && (
                <a
                  href={`https://twitter.com/${author.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  🐦 Twitter
                </a>
              )}
              {author.linkedin && (
                <a
                  href={`https://linkedin.com/in/${author.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  💼 LinkedIn
                </a>
              )}
              {author.github && (
                <a
                  href={`https://github.com/${author.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  📚 GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Author's Posts */}
      <section className={styles.postsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Posts by {author.name} ({posts?.length || 0})
          </h2>
          <Link href="/blog" className={styles.backLink}>
            ← Back to All Posts
          </Link>
        </div>

        {posts && posts.length > 0 ? (
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
                    width={300}
                    height={200}
                    className={styles.image}
                  />
                </div>
                <div className={styles.postContent}>
                  <div className={styles.postMeta}>
                    <span className={styles.postDate}>
                      {formatDate(post.date)}
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
                  <div className={styles.readMore}>
                    Read More <span className={styles.arrow}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No posts found for this author yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
