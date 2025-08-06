import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import ActionBar from "@/components/ActionBar/ActionBar";
import EngagementSection from "@/components/EngagementSection/EngagementSection";
import ViewTracker from "./ViewTracker";
import { supabase } from "@/services/supabaseClient";
import { calculateReadTime, formatReadTime } from "@/lib/utils/readTime";

export default async function Post({ params }) {
  const { slug } = await params;

  // First get the blog post
  const { data: blog, error } = await supabase
    .from("blogs")
    .select("*")
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

  // Then get the author profile if author_id exists
  let authorProfile = null;
  if (blog.author_id) {
    console.log("Looking for author with ID:", blog.author_id);
    const { data: author, error: authorError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, first_name, last_name, avatar_url, email, bio, professional_role"
      )
      .eq("id", blog.author_id)
      .single();

    if (!authorError) {
      authorProfile = author;
      console.log("Found author:", authorProfile);
    } else {
      console.error("Author error:", authorError);
    }
  } else {
    console.log("No author_id found in blog");
  }

  const formattedDate = new Date(blog.created_at).toLocaleDateString(
    undefined,
    { year: "numeric", month: "short", day: "numeric" }
  );

  const tags =
    blog.tags && blog.tags.trim()
      ? blog.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

  // Fetch related posts with improved logic
  let relatedPosts = [];

  console.log("🔍 Current blog:", {
    id: blog.id,
    category_id: blog.category_id,
    tags,
  });

  // Strategy 1: Same category posts (highest priority)
  if (blog.category_id) {
    console.log("🎯 Searching for posts in same category:", blog.category_id);
    const { data: categoryPosts, error: categoryError } = await supabase
      .from("blogs")
      .select(
        `
        id,
        title,
        slug,
        description,
        image,
        created_at,
        category_id,
        tags,
        categories (
          id,
          name,
          color
        )
      `
      )
      .neq("id", blog.id)
      .eq("category_id", blog.category_id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (categoryError) {
      console.error("❌ Error fetching category posts:", categoryError);
    } else if (categoryPosts && categoryPosts.length > 0) {
      console.log("✅ Found category posts:", categoryPosts.length);
      relatedPosts = categoryPosts;
    } else {
      console.log("⚠️ No posts found in same category");
    }
  }

  // Strategy 2: Tag-based matching (if we need more posts)
  if (relatedPosts.length < 3 && tags.length > 0) {
    console.log("🏷️ Searching for posts with similar tags:", tags);
    const remainingCount = 3 - relatedPosts.length;
    const excludeIds = relatedPosts.map((p) => p.id);

    // Create a more flexible tag search
    let tagPosts = [];

    for (const tag of tags) {
      if (tagPosts.length >= remainingCount) break;

      const { data: posts, error } = await supabase
        .from("blogs")
        .select(
          `
          id,
          title,
          slug,
          description,
          image,
          created_at,
          category_id,
          tags,
          categories (
            id,
            name,
            color
          )
        `
        )
        .neq("id", blog.id)
        .not(
          "id",
          "in",
          `(${
            [...excludeIds, ...tagPosts.map((p) => p.id)]
              .map((id) => `'${id}'`)
              .join(",") || "''"
          })`
        )
        .ilike("tags", `%${tag.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(remainingCount - tagPosts.length);

      if (!error && posts && posts.length > 0) {
        console.log(`✅ Found ${posts.length} posts for tag "${tag}"`);
        tagPosts = [...tagPosts, ...posts];
      }
    }

    if (tagPosts.length > 0) {
      relatedPosts = [...relatedPosts, ...tagPosts.slice(0, remainingCount)];
      console.log("✅ Added tag-based posts:", tagPosts.length);
    }
  }

  // Strategy 3: Title similarity (if still need more)
  if (relatedPosts.length < 3) {
    console.log("📝 Searching for posts with similar titles");
    const remainingCount = 3 - relatedPosts.length;
    const excludeIds = relatedPosts.map((p) => p.id);

    // Extract key words from current title (exclude common words)
    const titleWords = blog.title
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          ![
            "the",
            "and",
            "for",
            "with",
            "that",
            "this",
            "from",
            "they",
            "have",
            "been",
            "will",
            "your",
            "what",
            "when",
            "where",
            "how",
          ].includes(word)
      );

    if (titleWords.length > 0) {
      const titleConditions = titleWords
        .slice(0, 3)
        .map((word) => `title.ilike.%${word}%`);

      const { data: titlePosts, error: titleError } = await supabase
        .from("blogs")
        .select(
          `
          id,
          title,
          slug,
          description,
          image,
          created_at,
          category_id,
          tags,
          categories (
            id,
            name,
            color
          )
        `
        )
        .neq("id", blog.id)
        .not(
          "id",
          "in",
          `(${excludeIds.map((id) => `'${id}'`).join(",") || "''"})`
        )
        .or(titleConditions.join(","))
        .order("created_at", { ascending: false })
        .limit(remainingCount);

      if (!titleError && titlePosts && titlePosts.length > 0) {
        console.log("✅ Found title-similar posts:", titlePosts.length);
        relatedPosts = [...relatedPosts, ...titlePosts];
      }
    }
  }

  // Strategy 4: Recent posts (last resort, but only if we have NO related posts)
  if (relatedPosts.length === 0) {
    console.log("📅 Falling back to recent posts");
    const { data: recentPosts, error: recentError } = await supabase
      .from("blogs")
      .select(
        `
        id,
        title,
        slug,
        description,
        image,
        created_at,
        categories (
          id,
          name,
          color
        )
      `
      )
      .neq("id", blog.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentError) {
      console.error("❌ Error fetching recent posts:", recentError);
    } else if (recentPosts && recentPosts.length > 0) {
      console.log("✅ Found recent posts:", recentPosts.length);
      relatedPosts = recentPosts;
    }
  }

  // Limit to 3 posts maximum
  relatedPosts = relatedPosts.slice(0, 3);
  console.log(
    "🎯 Final related posts:",
    relatedPosts.length,
    relatedPosts.map((p) => ({ title: p.title, category: p.categories?.name }))
  );

  return (
    <div className={styles.container}>
      <ViewTracker blogId={blog.id} />
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
            href={authorProfile?.id ? `/author/${authorProfile.id}` : "#"}
            className={styles.authorLink}
          >
            <Image
              src={authorProfile?.avatar_url || "/images/me.jpg"}
              alt={authorProfile?.full_name || "Author"}
              width={40}
              height={40}
              className={styles.authorAvatar}
            />
            <div>
              <div className={styles.author}>
                {authorProfile?.full_name ||
                  (authorProfile?.first_name && authorProfile?.last_name
                    ? `${authorProfile.first_name} ${authorProfile.last_name}`
                    : "Nahed Nakib")}
              </div>
              <div className={styles.authorRole}>
                {authorProfile?.professional_role ||
                  authorProfile?.role ||
                  "Founder & CEO"}
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
            {blog.readTime
              ? formatReadTime(blog.readTime)
              : formatReadTime(calculateReadTime(blog.content))}
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
      {relatedPosts.length > 0 && (
        <section className={styles.relatedSection}>
          <h2>Related Posts</h2>
          <ul className={styles.relatedList}>
            {relatedPosts.map((post) => (
              <li key={post.id}>
                <Link
                  className={styles.relatedListItem}
                  href={`/blog/${post.slug}`}
                >
                  <img
                    className={styles.relatedPostThumb}
                    src={post.image || "/images/portfolio.jpg"}
                    alt={post.title}
                  />
                  <div className={styles.relatedPostInfo}>
                    <span className={styles.relatedPostTitle}>
                      {post.title}
                    </span>
                    <span className={styles.relatedPostDesc}>
                      {post.description || "Read this amazing blog post..."}
                    </span>
                  </div>
                  <span className={styles.relatedReadMore}>
                    Read More <span className={styles.arrow}>→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
