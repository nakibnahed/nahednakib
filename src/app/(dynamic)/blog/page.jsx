"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { Calendar, Clock, ArrowRight, Eye } from "lucide-react";
import { useViews } from "@/hooks/useViews";
import { calculateReadTime, formatReadTime } from "@/lib/utils/readTime";

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  // Blog Views Component
  function BlogViews({ blogId }) {
    const [viewsCount, setViewsCount] = useState(0);

    useEffect(() => {
      // Generate random numbers for views only
      const randomViews = Math.floor(Math.random() * 500) + 50; // 50-550 views
      setViewsCount(randomViews);
    }, [blogId]);

    return (
      <div className={styles.icon}>
        <Eye size={20} strokeWidth={2} />
        <span className={styles.iconText}>{viewsCount}</span>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    setCategories(categoriesData || []);

    // Fetch blogs with category info
    const { data: blogsData, error } = await supabase
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
    } else {
      setBlogs(blogsData || []);
    }

    setLoading(false);
  }

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

  if (loading) {
    return (
      <div className="pageMainContainer">
        <div className={styles.container}>
          <div className={styles.loading}>Loading blogs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Blog</h1>

        {/* Category Navigation */}
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
              style={{
                "--category-color": category.color,
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Category Header */}
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

        {/* Blog Grid */}
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
                      <p className={styles.date}>
                        {formatDate(blog.created_at)}
                      </p>
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
      </div>
    </div>
  );
}
