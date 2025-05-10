import { portfolios } from "@/app/(dynamic)/portfolio/data"; // ✅ Correct path
import { notFound } from "next/navigation"; // ✅ Handles 404 if portfolio not found
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";

export default function Post({ params }) {
  // ✅ Make sure params.id exists and the portfolio data is available
  const portfolio = portfolios.find((p) => p.id === params.id);

  // ✅ If portfolio is not found, show 404
  if (!portfolio) {
    return notFound();
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.imgContainer}>
          <Image
            className={styles.image}
            src={portfolio.image}
            alt={portfolio.title}
            layout="fill" // Used layout="fill" to cover the image container
          />
          <div className={styles.info}>
            <h1 className={styles.title}>{portfolio.title}</h1>
            <nav className={styles.breadcrumb}>
              <Link href="/" className={styles.link}>
                Home
              </Link>
              <span className={styles.separator}> / </span>
              <Link href="/portfolio" className={styles.link}>
                Portfolio
              </Link>
              <span className={styles.separator}> / </span>
              <span className={styles.current}>{portfolio.category}</span>
            </nav>
          </div>
        </div>
      </header>
      <div className={styles.content}>
        {/* Render HTML content dynamically */}
        <div
          className={styles.text}
          dangerouslySetInnerHTML={{ __html: portfolio.content }}
        />
      </div>
    </div>
  );
}
