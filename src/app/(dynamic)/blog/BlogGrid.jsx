"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { calculateReadTime, formatReadTime } from "@/lib/utils/readTime";
import BlogViews from "./BlogViews";

export default function BlogGrid({ blogs, categories }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredBlogs =
    selectedCategory === "all"
      ? blogs
      : blogs.filter((blog) => blog.categories?.slug === selectedCategory);

  const selectedCategoryData = categories.find(
    (cat) => cat.slug === selectedCategory
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
          {categories.map((category) => (
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

      {selectedCategory !== "all" && selectedCategoryData && (
        <div className={styles.categoryHeader}>
          <div
            className={styles.categoryIndicator}
            style={{ backgroundColor: selectedCategoryData.color }}
          />
          <h2 className={styles.categoryTitle}>
            {selectedCategoryData.name}
          </h2>
          {selectedCategoryData.description && (
            <p className={styles.categoryDescription}>
              {selectedCategoryData.description}
            </p>
          )}
        </div>
      )}

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
                    <BlogViews blogId={blog.id} />
                    <h1 className={styles.title}>{blog.title}</h1>
                    <p className={styles.date}>{formatDate(blog.created_at)}</p>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.technologies}>
                      {blog.categories && (
                        <span className={styles.techTag}>
                          {blog.categories.name}
                        </span>
                      )}
                      <span className={styles.techTag}>
                        {formatReadTime(calculateReadTime(blog.content))}
                      </span>
                    </div>
                    <p className={styles.description}>
                      {blog.description || "Read this amazing blog post..."}
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
    </>
  );
}
