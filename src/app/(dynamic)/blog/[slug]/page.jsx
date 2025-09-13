import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./page.module.css";
import ActionBar from "@/components/ActionBar/ActionBar";
import EngagementSection from "@/components/EngagementSection/EngagementSection";
import ViewTracker from "./ViewTracker";
import { supabase } from "@/services/supabaseClient";
import { calculateReadTime, formatReadTime } from "@/lib/utils/readTime";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  // Optimized: Fetch blog post with author in single query
  let { data: blog, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      profiles:author_id (
        full_name,
        first_name,
        last_name
      )
    `
    )
    .eq("slug", slug)
    .single();

  // Fallback: if not found by slug, try by ID (for legacy links)
  if ((error || !blog) && slug) {
    const { data: byId, error: idError } = await supabase
      .from("blogs")
      .select(
        `
        *,
        profiles:author_id (
          full_name,
          first_name,
          last_name
        )
      `
      )
      .eq("id", slug)
      .single();
    if (!idError && byId) {
      blog = byId;
      error = null;
    }
  }

  if (error || !blog) {
    return {
      title: "Blog Post Not Found",
      description:
        "The blog post you're looking for doesn't exist or has been moved.",
    };
  }

  // Get author name from joined data
  let authorName = "Nahed Nakib";
  if (blog.profiles) {
    authorName =
      blog.profiles.full_name ||
      (blog.profiles.first_name && blog.profiles.last_name
        ? `${blog.profiles.first_name} ${blog.profiles.last_name}`
        : "Nahed Nakib");
  }

  // Clean description from HTML content
  const cleanDescription =
    blog.description ||
    blog.content?.replace(/<[^>]*>/g, "").substring(0, 160) + "..." ||
    "Read this amazing blog post about web development, technology, and more.";

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nahednakib.vercel.app";
  const postUrl = `${baseUrl}/blog/${blog.slug}`;
  const imageUrl = blog.image || `${baseUrl}/images/portfolio.jpg`;

  return {
    title: blog.title,
    description: cleanDescription,
    authors: [{ name: authorName }],
    openGraph: {
      title: blog.title,
      description: cleanDescription,
      url: postUrl,
      siteName: "Nahed Nakib Blog",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime: blog.created_at,
      authors: [authorName],
      tags: blog.tags ? blog.tags.split(",").map((tag) => tag.trim()) : [],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: cleanDescription,
      images: [imageUrl],
      creator: "@your_twitter_handle", // Replace with your actual Twitter handle
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

export default async function Post({ params }) {
  const { slug } = await params;

  // Optimized: Get blog post with author in single query
  let { data: blog, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      profiles:author_id (
        id,
        full_name,
        first_name,
        last_name,
        avatar_url,
        email,
        bio,
        professional_role
      )
    `
    )
    .eq("slug", slug)
    .single();

  // Fallback: if not found by slug, try by ID
  if ((error || !blog) && slug) {
    const { data: byId, error: idError } = await supabase
      .from("blogs")
      .select(
        `
        *,
        profiles:author_id (
          id,
          full_name,
          first_name,
          last_name,
          avatar_url,
          email,
          bio,
          professional_role
        )
      `
      )
      .eq("id", slug)
      .single();
    if (!idError && byId) {
      blog = byId;
      error = null;
    }
  }

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

  // Author profile from joined data
  const authorProfile = blog.profiles;

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

  // Optimized: Get related posts with single query
  let relatedPosts = [];

  try {
    // Single optimized query for related posts
    const { data: allRelatedPosts, error: relatedError } = await supabase
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
      .order("created_at", { ascending: false })
      .limit(10); // Get fewer posts for faster query

    if (!relatedError && allRelatedPosts) {
      // Priority 1: Same category
      const categoryPosts = allRelatedPosts.filter(
        (post) => post.category_id === blog.category_id
      );

      // Priority 2: Similar tags
      const tagPosts = allRelatedPosts.filter((post) => {
        if (!post.tags || !tags.length) return false;
        const postTags = post.tags.toLowerCase();
        return tags.some((tag) => postTags.includes(tag.toLowerCase()));
      });

      // Combine and deduplicate
      const combined = [...categoryPosts];

      // Add tag posts that aren't already included
      tagPosts.forEach((post) => {
        if (!combined.find((p) => p.id === post.id)) {
          combined.push(post);
        }
      });

      // Add other recent posts if still need more
      if (combined.length < 3) {
        allRelatedPosts.forEach((post) => {
          if (combined.length >= 3) return;
          if (!combined.find((p) => p.id === post.id)) {
            combined.push(post);
          }
        });
      }

      relatedPosts = combined.slice(0, 3);
    }
  } catch (error) {
    console.error("Error fetching related posts:", error);
    relatedPosts = [];
  }

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
      <Suspense
        fallback={
          <div className={styles.engagementLoading}>Loading engagement...</div>
        }
      >
        <EngagementSection
          contentType="blog"
          contentId={blog.id}
          title={blog.title}
          id="comments-section"
        />
      </Suspense>
      {relatedPosts.length > 0 && (
        <section className={styles.relatedSection}>
          <h2>You May Also Be Interested In:</h2>
          <ul className={styles.relatedList}>
            {relatedPosts.map((post) => (
              <li key={post.id}>
                <Link
                  className={styles.relatedListItem}
                  href={`/blog/${post.slug}`}
                >
                  <Image
                    className={styles.relatedPostThumb}
                    src={post.image || "/images/portfolio.jpg"}
                    alt={post.title}
                    width={48}
                    height={48}
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
