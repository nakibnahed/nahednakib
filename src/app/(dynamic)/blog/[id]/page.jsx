import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";
import { notFound } from "next/navigation";

// Use the same mock data array as in the list page
const posts = [
  {
    id: "post-1",
    title: "Blog Post 1",
    date: "12/05/2024",
    description: "This is the description for Blog Post 1.",
    category: "General",
    image: "/images/blog.jpg",
    content: "<p>This is the content for Blog Post 1.</p>",
  },
  {
    id: "post-2",
    title: "Blog Post 2",
    date: "13/05/2024",
    description: "This is the description for Blog Post 2.",
    category: "Updates",
    image: "/images/blog.jpg",
    content: "<p>This is the content for Blog Post 2.</p>",
  },
  {
    id: "post-3",
    title: "Blog Post 3",
    date: "14/05/2024",
    description: "This is the description for Blog Post 3.",
    category: "News",
    image: "/images/blog.jpg",
    content: "<p>This is the content for Blog Post 3.</p>",
  },
];

export default function BlogPost({ params }) {
  const { id } = params;
  const post = posts.find((p) => p.id === id);

  if (!post) return notFound();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.imageCard}>
          <Image
            className={styles.image}
            src={post.image}
            alt={post.title}
            fill
            sizes="220px"
            priority
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{post.title}</h1>
          <span className={styles.publishDate}>{post.date}</span>
          <span className={styles.category}>{post.category}</span>
          <nav className={styles.breadcrumb}>
            <Link href="/" className={styles.link}>
              Home
            </Link>
            <span className={styles.separator}>/</span>
            <Link href="/blog" className={styles.link}>
              Blog
            </Link>
            <span className={styles.separator}>/</span>
            <span className={styles.current}>{post.category}</span>
          </nav>
        </div>
      </div>
      <div className={styles.content}>
        <div
          className={styles.text}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </div>
  );
}
