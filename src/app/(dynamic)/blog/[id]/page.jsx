import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import IconRow from "./IconRow";

export default async function Post({ params }) {
  // Await params if it's a Promise (Next.js 14+)
  const actualParams = await params;
  const { id } = actualParams;

  // Fetch from 'blogs' table instead of 'portfolios'
  const { data: blog, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return <p>Error: {error.message}</p>;
  if (!blog) return <p>Not found</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.imageCard}>
          <Image
            className={styles.image}
            src={blog.image || "/images/blog.jpg"} // Change fallback if you want
            alt={blog.title}
            fill
            sizes="220px"
            priority
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{blog.title}</h1>
          {blog.created_at && (
            <span className={styles.publishDate}>
              {new Date(blog.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <span className={styles.category}>{blog.category}</span>
          <nav className={styles.breadcrumb}>
            <Link href="/" className={styles.link}>
              Home
            </Link>
            <span className={styles.separator}>/</span>
            <Link href="/blog" className={styles.link}>
              Blog
            </Link>
            <span className={styles.separator}>/</span>
            <span className={styles.current}>{blog.category}</span>
          </nav>
          <IconRow title={blog.title} />
        </div>
      </div>
      <div className={styles.content}>
        <div
          className={styles.text}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>
    </div>
  );
}
