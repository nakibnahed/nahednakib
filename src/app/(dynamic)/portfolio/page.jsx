import { supabase } from "@/services/supabaseClient";
import Link from "next/link";
import styles from "./page.module.css";
import { Globe } from "lucide-react";

export default async function Portfolio() {
  const { data: portfolios, error } = await supabase
    .from("portfolios")
    .select("*");

  if (error) {
    return <p>Failed to load portfolios</p>;
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Crafted with Code & Passion</h1>
      <div className={styles.mainContainer}>
        {portfolios.map((portfolio) => (
          <Link
            key={portfolio.id}
            href={`/portfolio/${portfolio.id}`}
            className={styles.post}
          >
            <div className={styles.container}>
              <div className={styles.content}>
                <div className={styles.icon}>
                  <Globe size={24} strokeWidth={2} />
                </div>
                <h1 className={styles.title}>{portfolio.title}</h1>
                <p className={styles.date}>{portfolio.date}</p>
                <p className={styles.description}>{portfolio.description}</p>
                <div className={styles.readMore}>
                  <span>Read More</span>
                  <span className={styles.arrow}>→</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
