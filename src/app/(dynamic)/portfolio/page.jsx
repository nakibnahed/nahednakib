export const dynamic = "force-dynamic";

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
    <div className={styles.mainContainer}>
      <h1 className={styles.pageTitle}>Crafted with Code & Passion</h1>
      <div className={styles.gridContainer}>
        {portfolios.map((portfolio) => (
          <Link
            key={portfolio.id}
            href={`/portfolio/${portfolio.id}`}
            className={styles.post}
          >
            <div className={styles.card}>
              <div>
                <div className={styles.icon}>
                  <Globe size={24} strokeWidth={2} />
                </div>
                <h1 className={styles.title}>{portfolio.title}</h1>
                <p className={styles.date}>{portfolio.date}</p>
                <p className={styles.description}>{portfolio.description}</p>
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
  );
}
