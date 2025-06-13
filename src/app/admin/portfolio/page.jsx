"use client";

import styles from "./PortfolioList.module.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";

export default function PortfolioListPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  async function fetchPortfolios() {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching portfolios:", error);
    } else {
      setPortfolios(data);
    }
    setLoading(false);
  }

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageTitle}>Portfolios</h1>

      <Link href="/admin/portfolio/new" className={styles.newButton}>
        Create New Portfolio
      </Link>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Category</th>
                <th>Image</th>
                <th>Description</th>
                <th>Content</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolios.map((portfolio) => (
                <tr key={portfolio.id}>
                  <td>{portfolio.title}</td>
                  <td>{portfolio.date}</td>
                  <td>{portfolio.category}</td>
                  <td>
                    {portfolio.image ? (
                      <img
                        src={portfolio.image}
                        alt={portfolio.title}
                        style={{
                          maxWidth: "100px",
                          maxHeight: "60px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      "No image"
                    )}
                  </td>
                  <td>{portfolio.description || "—"}</td>
                  <td>
                    {portfolio.content
                      ? portfolio.content.length > 50
                        ? portfolio.content.substring(0, 50) + "..."
                        : portfolio.content
                      : "—"}
                  </td>
                  <td>
                    <Link href={`/admin/portfolio/${portfolio.id}/edit`}>
                      <button className={styles.actionButton}>Edit</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
