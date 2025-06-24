import Link from "next/link";
import styles from "./page.module.css";
import { Globe } from "lucide-react";

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

export default function Blog() {
  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Blog</h1>
        <div className={styles.gridContainer}>
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className={styles.post}
            >
              <div className={styles.card}>
                <div>
                  <div className={styles.icon}>
                    <Globe size={24} strokeWidth={2} />
                  </div>
                  <h1 className={styles.cardTitle}>{post.title}</h1>
                  <p className={styles.date}>{post.date}</p>
                  <p className={styles.description}>{post.description}</p>
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
