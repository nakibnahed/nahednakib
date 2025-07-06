"use client";

import styles from "./PortfolioList.module.css";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { Edit, Trash2 } from "lucide-react";

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
      alert("Error deleting portfolio: " + error.message);
    } else {
      setPortfolios((prev) =>
        prev.filter((p) => p.id !== portfolioToDelete.id)
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
        (p.date && p.date.toLowerCase().includes(lowerTerm))
    );
  }, [portfolios, searchTerm]);

  return (
    <div className={styles.mainContainer}>
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

      {loading ? (
        <p>Loading...</p>
      ) : filteredPortfolios.length === 0 ? (
        <p>No portfolios found.</p>
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
                      <img
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
