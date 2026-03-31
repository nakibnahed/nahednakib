import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./page.module.css";
import ActionBar from "@/components/ActionBar/ActionBar";
import EngagementSection from "@/components/EngagementSection/EngagementSection";
import ViewTracker from "./ViewTracker";
import { supabase } from "@/services/supabaseClient";
import { calculateReadTime, formatReadTime } from "@/lib/utils/readTime";
import {
  MAIN_AUTHOR_AVATAR,
  MAIN_AUTHOR_FALLBACK_HREF,
  MAIN_AUTHOR_NAME,
  MAIN_AUTHOR_ROLE,
} from "@/constants/mainAuthor";

/**
 * Load post by slug, then by id (legacy). Author is loaded separately so we do not
 * rely on PostgREST embedding `authors:author_id` (requires FK + schema cache).
 */
async function loadBlogAndAuthor(slug) {
  let { data: blog, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { blog: null, author: null, error };
  }

  if (!blog && slug) {
    const second = await supabase
      .from("blogs")
      .select("*")
      .eq("id", slug)
      .maybeSingle();
    blog = second.data;
    if (second.error) {
      return { blog: null, author: null, error: second.error };
    }
  }

  let author = null;
  if (blog?.author_id) {
    const { data: authorRow, error: authorError } = await supabase
      .from("authors")
      .select("id, name, bio, role, avatar_url")
      .eq("id", blog.author_id)
      .maybeSingle();
    if (!authorError) {
      author = authorRow;
    }
  }

  return { blog, author, error: null };
}

function formatSupabaseError(err) {
  if (!err || typeof err !== "object") return String(err);
  const msg = err.message || err.details || err.hint || err.code;
  return msg ? `${msg}${err.code ? ` (${err.code})` : ""}` : JSON.stringify(err);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { blog, author } = await loadBlogAndAuthor(slug);

  if (!blog) {
    return {
      title: "Blog Post Not Found",
      description:
        "The blog post you're looking for doesn't exist or has been moved.",
    };
  }

  const authorName = author?.name?.trim() || MAIN_AUTHOR_NAME;

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
      creator: "@your_twitter_handle",
    },
    alternates: {
      canonical: postUrl,
    },
    other: {
      author: authorName,
    },
  };
}

export default async function Post({ params }) {
  const { slug } = await params;
  const { blog, author, error } = await loadBlogAndAuthor(slug);

  if (error) {
    console.error("Database error:", formatSupabaseError(error));
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

  const authorName = author?.name?.trim() || MAIN_AUTHOR_NAME;
  const authorRoleLine = author
    ? author.role?.trim() || ""
    : MAIN_AUTHOR_ROLE;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nahednakib.vercel.app";
  const imageUrl = blog.image || `${baseUrl}/images/portfolio.jpg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    datePublished: blog.created_at,
    image: imageUrl,
    author: {
      "@type": "Person",
      name: authorName,
      ...(author?.id
        ? { url: `${baseUrl}/author/${author.id}` }
        : { url: `${baseUrl}${MAIN_AUTHOR_FALLBACK_HREF}` }),
    },
  };

  const formattedDate = new Date(blog.created_at).toLocaleDateString(
    undefined,
    { year: "numeric", month: "short", day: "numeric" },
  );

  const tags =
    blog.tags && blog.tags.trim()
      ? blog.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

  let relatedPosts = [];

  try {
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
      `,
      )
      .neq("id", blog.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!relatedError && allRelatedPosts) {
      const categoryPosts = allRelatedPosts.filter(
        (post) => post.category_id === blog.category_id,
      );

      const tagPosts = allRelatedPosts.filter((post) => {
        if (!post.tags || !tags.length) return false;
        const postTags = post.tags.toLowerCase();
        return tags.some((tag) => postTags.includes(tag.toLowerCase()));
      });

      const combined = [...categoryPosts];

      tagPosts.forEach((post) => {
        if (!combined.find((p) => p.id === post.id)) {
          combined.push(post);
        }
      });

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
  } catch (e) {
    console.error("Error fetching related posts:", e);
    relatedPosts = [];
  }

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            href={
              author?.id ? `/author/${author.id}` : MAIN_AUTHOR_FALLBACK_HREF
            }
            className={styles.authorLink}
          >
            <Image
              src={author?.avatar_url || MAIN_AUTHOR_AVATAR}
              alt={authorName}
              width={40}
              height={40}
              className={styles.authorAvatar}
            />
            <div>
              <div className={styles.author}>{authorName}</div>
              {authorRoleLine ? (
                <div className={styles.authorRole}>{authorRoleLine}</div>
              ) : null}
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
