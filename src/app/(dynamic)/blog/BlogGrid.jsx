"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { calculateReadTime, formatReadTime } from "@/lib/utils/readTime";
import BlogViews from "./BlogViews";

export default function BlogGrid({ blogs, categories }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredBlogs =
    selectedCategory === "all"
      ? blogs
      : blogs.filter((blog) => blog.categories?.slug === selectedCategory);

  const categoriesWithPosts = categories.filter((cat) =>
    blogs.some((blog) => blog.categories?.slug === cat.slug)
  );


  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <>
      <div className={styles.categoryNavWrapper}>
        <div className={styles.categoryNav}>
          <button
            className={`${styles.categoryButton} ${
              selectedCategory === "all" ? styles.active : ""
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            All Posts
          </button>
          {categoriesWithPosts.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryButton} ${
                selectedCategory === category.slug ? styles.active : ""
              }`}
              onClick={() => setSelectedCategory(category.slug)}
              style={{ "--category-color": category.color }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>


      {filteredBlogs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No blog posts found in this category.</p>
        </div>
      ) : (
        <div className={styles.gridContainer}>
          {filteredBlogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className={styles.post}
            >
              <article className={styles.card}>
                {/* Cover */}
                <div className={styles.cardCover}>
                  {blog.image ? (
                    <Image
                      src={blog.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={styles.cardCoverImg}
                    />
                  ) : (
                    <div
                      className={styles.cardCoverPlaceholder}
                      aria-hidden="true"
                    >
                      <span>cover</span>
                    </div>
                  )}

                  {blog.categories && (
                    <span className={styles.cardStrap}>
                      <span className={styles.cardStrapDot} />
                      {blog.categories.name}
                    </span>
                  )}

                  <span className={styles.cardViews}>
                    <BlogViews blogId={blog.id} />
                  </span>
                </div>

                {/* Body */}
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{blog.title}</h2>
                  <p className={styles.cardDescription}>
                    {blog.description || "Read this amazing blog post..."}
                  </p>

                  <div className={styles.cardFoot}>
                    <span>{formatDate(blog.created_at)}</span>
                    <span className={styles.cardFootDot} />
                    <span>
                      {formatReadTime(calculateReadTime(blog.content))}
                    </span>
                    <span className={styles.cardReadMore}>
                      Read
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" aria-hidden="true">
                        <path d="M3 8 H 13 M 9 4 L 13 8 L 9 12" />
                      </svg>
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
