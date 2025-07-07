export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";
import PortfolioCard from "@/components/PortfolioCard/PortfolioCard";

export default async function Portfolio() {
  try {
    const supabase = await createClient();

    // Fetch all needed fields, including technologies
    const { data: portfolios, error } = await supabase
      .from("portfolios")
      .select(
        `
        id,
        title,
        description,
        created_at,
        category,
        image,
        technologies
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error.message);
      return <p>Failed to load portfolios</p>;
    }

    if (!portfolios || portfolios.length === 0) {
      return <p>No portfolios available</p>;
    }

    return (
      <div className="pageMainContainer">
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Crafted with Passion</h1>
          <div className={styles.gridContainer}>
            {portfolios.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} />
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in Portfolio component:", error);
    return <p>Failed to load portfolios</p>;
  }
}
