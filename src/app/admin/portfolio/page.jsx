"use client";

import admin from "@/components/Admin/adminPage.module.css";
import styles from "./PortfolioList.module.css";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import { Edit, Trash2, Briefcase, ListFilter } from "lucide-react";

export default function PortfolioListPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState(null);

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
      setPortfolios([]);
    } else {
      setPortfolios(data);
    }
    setLoading(false);
  }

  function confirmDelete(portfolio) {
    setPortfolioToDelete(portfolio);
    setShowDeleteConfirm(true);
  }

  async function handleDelete() {
    if (!portfolioToDelete) return;

    setLoading(true);
    const { error } = await supabase
      .from("portfolios")
      .delete()
      .eq("id", portfolioToDelete.id);

    if (error) {
      showAppToast(
        error.message || "Could not delete this portfolio item.",
        "error",
      );
    } else {
      showAppToast("Portfolio item deleted.", "success");
      setPortfolios((prev) =>
        prev.filter((p) => p.id !== portfolioToDelete.id),
      );
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setPortfolioToDelete(null);
  }

  const filteredPortfolios = useMemo(() => {
    if (!searchTerm) return portfolios;
    const lowerTerm = searchTerm.toLowerCase();
    return portfolios.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(lowerTerm)) ||
        (p.category && p.category.toLowerCase().includes(lowerTerm)) ||
        (p.date && p.date.toLowerCase().includes(lowerTerm)),
    );
  }, [portfolios, searchTerm]);

  const listStats = useMemo(
    () => ({
      total: portfolios.length,
      showing: filteredPortfolios.length,
    }),
    [portfolios.length, filteredPortfolios.length],
  );

  return (
    <div className={`${admin.page} ${styles.mainContainer}`}>
      <header className={admin.pageHeader}>
        <p className={admin.eyebrow}>Showcase</p>
        <h1 className={admin.pageTitle}>Portfolio</h1>
        <p className={admin.lead}>
          Manage projects, imagery, and metadata for your portfolio pages.
        </p>
      </header>

      <section className={admin.statsSection} aria-label="Summary">
        <div className={admin.statsGrid}>
          <div className={admin.statCard}>
            <Briefcase size={24} aria-hidden />
            <div>
              <h3>{listStats.total}</h3>
              <p>Projects</p>
            </div>
          </div>
          <div className={admin.statCard}>
            <ListFilter size={24} aria-hidden />
            <div>
              <h3>{listStats.showing}</h3>
              <p>Shown</p>
            </div>
          </div>
        </div>
      </section>

      <section className={admin.filtersSection} aria-label="Search and actions">
        <div className={styles.controlsRow}>
          <Link href="/admin/portfolio/new" className={styles.newButton}>
            Create New Portfolio
          </Link>

          <input
            type="text"
            placeholder="Search by title, category or date..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>
      </section>

      {loading ? (
        <div className={admin.loadingPanel}>
          <div className={admin.loadingSpinner} aria-hidden />
          <span>Loading portfolio…</span>
        </div>
      ) : filteredPortfolios.length === 0 ? (
        <p className={admin.emptyPanel}>No portfolios found.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Category</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPortfolios.map((portfolio) => (
                <tr key={portfolio.id}>
                  <td data-label="Title">
                    <h4>{portfolio.title}</h4>
                  </td>
                  <td data-label="Date">{portfolio.date}</td>
                  <td data-label="Category">{portfolio.category}</td>
                  <td data-label="Image">
                    {portfolio.image ? (
                      <Image
                        src={portfolio.image}
                        alt={portfolio.title}
                        width={100}
                        height={60}
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
                  <td data-label="Actions">
                    <div className={styles.actions}>
                      <Link href={`/admin/portfolio/${portfolio.id}/edit`}>
                        <button
                          className={styles.actionButton}
                          title="Edit portfolio"
                        >
                          <Edit size={16} />
                        </button>
                      </Link>
                      <button
                        className={styles.deleteButton}
                        onClick={() => confirmDelete(portfolio)}
                        type="button"
                        title="Delete portfolio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Portfolio"
        message="Are you sure you want to delete this portfolio? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
