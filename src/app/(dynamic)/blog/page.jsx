export const dynamic = "force-dynamic";

import { supabase } from "@/services/supabaseClient";
import Link from "next/link";
import styles from "./page.module.css";
import { Globe } from "lucide-react";

export default async function Blog() {
  const { data: blogs, error } = await supabase.from("blogs").select("*");

  if (error) {
    return <p>Failed to load blogs</p>;
  }

  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Blogs Page</h1>
        <div className={styles.gridContainer}>
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.id}`}
              className={styles.post}
            >
              <div className={styles.card}>
                <div>
                  <div className={styles.icon}>
                    <Globe size={24} strokeWidth={2} />
                  </div>
                  <h1 className={styles.title}>{blog.title}</h1>
                  <p className={styles.date}>{blog.date}</p>
                  <p className={styles.description}>{blog.description}</p>
                </div>
                <div className={styles.readMore}>
                  <span>Read More</span>
                  <span className={styles.arrow}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
