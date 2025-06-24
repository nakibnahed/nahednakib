import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import IconRow from "./IconRow";

export default async function Post({ params }) {
  // Await params if it's a Promise (Next.js 14+)
  const actualParams = await params;
  const { id } = actualParams;

  const { data: portfolio, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return <p>Error: {error.message}</p>;
  if (!portfolio) return <p>Not found</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.imageCard}>
          <Image
            className={styles.image}
            src={portfolio.image || "/images/portfolio.jpg"}
            alt={portfolio.title}
            fill
            sizes="220px"
            priority
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{portfolio.title}</h1>
          {portfolio.created_at && (
            <span className={styles.publishDate}>
              {new Date(portfolio.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <span className={styles.category}>{portfolio.category}</span>
          <nav className={styles.breadcrumb}>
            <Link href="/" className={styles.link}>
              Home
            </Link>
            <span className={styles.separator}>/</span>
            <Link href="/portfolio" className={styles.link}>
              Portfolio
            </Link>
            <span className={styles.separator}>/</span>
            <span className={styles.current}>{portfolio.category}</span>
          </nav>
          <IconRow title={portfolio.title} />
        </div>
      </div>
      <div className={styles.content}>
        <div
          className={styles.text}
          dangerouslySetInnerHTML={{ __html: portfolio.content }}
        />
      </div>
    </div>
  );
}
