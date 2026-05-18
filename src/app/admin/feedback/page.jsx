"use client";

import admin from "@/components/Admin/adminPage.module.css";
import AdminListSkeleton from "@/components/Skeletons/AdminListSkeleton";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "./Feedback.module.css";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import * as XLSX from "xlsx";
import {
  MessageSquare,
  Star,
  User,
  Filter,
  Search,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Bug,
  Zap,
  Monitor,
  HelpCircle,
  Download,
  FileSpreadsheet,
  FileJson,
  Clock,
  X,
} from "lucide-react";

const categoryConfig = {
  general: { icon: MessageSquare, color: "#6b7280", label: "General" },
  bug:     { icon: Bug,           color: "#ef4444", label: "Bug" },
  feature: { icon: Zap,           color: "#3b82f6", label: "Feature" },
  performance: { icon: Monitor,   color: "#10b981", label: "Performance" },
  ui:      { icon: HelpCircle,    color: "#f59e0b", label: "UI" },
};

function getCategory(cat) {
  return categoryConfig[cat] || categoryConfig.general;
}

function initials(name) {
  return (name || "?").trim().slice(0, 2).toUpperCase();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffH = Math.floor((now - date) / 3_600_000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StarRating({ rating }) {
  if (!rating) return <span className={styles.noRating}>No rating</span>;
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= rating ? styles.starFilled : styles.starEmpty}
        />
      ))}
    </span>
  );
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target))
        setShowExportMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportMenu]);

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("feedback_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      setError("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    try {
      const { error } = await supabase
        .from("feedback_messages")
        .delete()
        .eq("id", feedbackToDelete);
      if (error) throw error;
      setFeedback((prev) => prev.filter((item) => item.id !== feedbackToDelete));
      showAppToast("Feedback deleted.", "success");
    } catch {
      showAppToast("Failed to delete feedback.", "error");
    } finally {
      setShowDeleteModal(false);
      setFeedbackToDelete(null);
    }
  };

  const filtered = feedback
    .filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.feedback?.toLowerCase().includes(q);
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchRating =
        selectedRating === "all" ||
        (selectedRating === "no-rating" && !item.rating) ||
        item.rating?.toString() === selectedRating;
      return matchSearch && matchCat && matchRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":      return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":      return new Date(a.created_at) - new Date(b.created_at);
        case "rating-high": return (b.rating || 0) - (a.rating || 0);
        case "rating-low":  return (a.rating || 0) - (b.rating || 0);
        case "name":        return (a.name || "").localeCompare(b.name || "");
        default:            return 0;
      }
    });

  const avgRating = feedback.filter((i) => i.rating).length
    ? (feedback.reduce((s, i) => s + (i.rating || 0), 0) /
        feedback.filter((i) => i.rating).length).toFixed(1)
    : "—";

  /* ── Export ── */
  const getExportRows = () =>
    filtered.map((item) => ({
      Name: item.name,
      Email: item.email,
      Category: item.category,
      Rating: item.rating ?? "",
      Feedback: item.feedback,
      "Submitted On": item.created_at ? new Date(item.created_at).toLocaleString() : "",
    }));

  const baseFilename = `feedback_${new Date().toISOString().split("T")[0]}`;

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = getExportRows();
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    triggerDownload(new Blob([csv], { type: "text/csv" }), `${baseFilename}.csv`);
    setShowExportMenu(false);
  };

  const exportExcel = () => {
    const rows = getExportRows();
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Feedback");
    XLSX.writeFile(wb, `${baseFilename}.xlsx`);
    setShowExportMenu(false);
  };

  const exportJSON = () => {
    const rows = getExportRows();
    if (!rows.length) return;
    triggerDownload(
      new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
      `${baseFilename}.json`
    );
    setShowExportMenu(false);
  };

  if (loading) return <AdminListSkeleton />;

  if (error) return (
    <div className={admin.page}>
      <div className={styles.errorState}>
        <AlertCircle size={32} />
        <p>{error}</p>
        <button onClick={fetchFeedback} className={styles.retryBtn}>Try again</button>
      </div>
    </div>
  );

  return (
    <div className={admin.page}>
      <header className={admin.pageHeader}>
        <p className={admin.eyebrow}>Product</p>
        <h1 className={admin.pageTitle}>Feedback</h1>
        <p className={admin.lead}>Search, filter, and review user feedback submissions.</p>
      </header>

      <section className={admin.statsSection} aria-label="Summary">
        <div className={admin.statsGrid}>
          <div className={admin.statCard}>
            <MessageSquare size={24} aria-hidden />
            <div><h3>{feedback.length}</h3><p>Total feedback</p></div>
          </div>
          <div className={admin.statCard}>
            <Star size={24} aria-hidden />
            <div><h3>{avgRating}</h3><p>Average rating</p></div>
          </div>
          <div className={admin.statCard}>
            <CheckCircle size={24} aria-hidden />
            <div>
              <h3>{feedback.filter((i) => i.rating && i.rating >= 4).length}</h3>
              <p>Positive (4–5 stars)</p>
            </div>
          </div>
        </div>
      </section>

      <section className={admin.filtersSection} aria-label="Filters">
        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} aria-hidden />
            <input
              type="text"
              placeholder="Search by name, email, or message…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.selectGroup}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All categories</option>
              <option value="general">General</option>
              <option value="bug">Bug report</option>
              <option value="feature">Feature request</option>
              <option value="performance">Performance</option>
              <option value="ui">User interface</option>
            </select>

            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
              <option value="no-rating">No rating</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="rating-high">Highest rating</option>
              <option value="rating-low">Lowest rating</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          <div className={styles.exportWrap} ref={exportMenuRef}>
            <button className={styles.exportBtn} onClick={() => setShowExportMenu((v) => !v)}>
              <Download size={14} />
              Export
            </button>
            {showExportMenu && (
              <div className={styles.exportMenu}>
                <button onClick={exportCSV} className={styles.exportMenuItem}>
                  <Download size={13} /> CSV
                </button>
                <button onClick={exportExcel} className={styles.exportMenuItem}>
                  <FileSpreadsheet size={13} /> Excel
                </button>
                <button onClick={exportJSON} className={styles.exportMenuItem}>
                  <FileJson size={13} /> JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className={admin.emptyPanel}>
          <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ margin: 0 }}>
            {searchTerm || selectedCategory !== "all" || selectedRating !== "all"
              ? "No feedback matches your filters."
              : "No feedback submitted yet."}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((item) => {
            const cat = getCategory(item.category);
            const CatIcon = cat.icon;
            return (
              <div key={item.id} className={styles.card}>
                {/* Avatar */}
                <div
                  className={styles.avatar}
                  style={{
                    background: `color-mix(in srgb, ${cat.color} 15%, transparent)`,
                    borderColor: `color-mix(in srgb, ${cat.color} 35%, transparent)`,
                    color: cat.color,
                  }}
                >
                  {initials(item.name)}
                </div>

                {/* Info */}
                <div className={styles.info}>
                  {/* Name row */}
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.email}>{item.email}</span>
                    <span
                      className={styles.catPill}
                      style={{
                        color: cat.color,
                        background: `color-mix(in srgb, ${cat.color} 12%, transparent)`,
                        borderColor: `color-mix(in srgb, ${cat.color} 35%, transparent)`,
                      }}
                    >
                      <CatIcon size={10} />
                      {cat.label}
                    </span>
                  </div>

                  {/* Pills row: rating + time */}
                  <div className={styles.pillsRow}>
                    <StarRating rating={item.rating} />
                    <span className={styles.timeChip}>
                      <Clock size={11} />
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  {/* Body — left-bordered quote */}
                  <p className={styles.body}>
                    <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2, marginRight: 8, opacity: 0.45 }} />
                    {item.feedback}
                  </p>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.viewBtn}
                    onClick={() => setSelectedFeedback(item)}
                    title="View full feedback"
                  >
                    <Eye size={13} />
                    View
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => { setFeedbackToDelete(item.id); setShowDeleteModal(true); }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedFeedback && (() => {
        const cat = getCategory(selectedFeedback.category);
        const CatIcon = cat.icon;
        return (
          <div
            className={styles.overlay}
            onClick={() => setSelectedFeedback(null)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <div className={styles.modalAvatar}
                  style={{
                    background: `color-mix(in srgb, ${cat.color} 15%, transparent)`,
                    borderColor: `color-mix(in srgb, ${cat.color} 35%, transparent)`,
                    color: cat.color,
                  }}
                >
                  {initials(selectedFeedback.name)}
                </div>
                <div className={styles.modalMeta}>
                  <span className={styles.modalName}>{selectedFeedback.name}</span>
                  <span className={styles.modalEmail}>{selectedFeedback.email}</span>
                </div>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setSelectedFeedback(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalPillsRow}>
                <span
                  className={styles.catPill}
                  style={{
                    color: cat.color,
                    background: `color-mix(in srgb, ${cat.color} 12%, transparent)`,
                    borderColor: `color-mix(in srgb, ${cat.color} 35%, transparent)`,
                  }}
                >
                  <CatIcon size={11} />
                  {cat.label}
                </span>
                <StarRating rating={selectedFeedback.rating} />
                <span className={styles.timeChip}>
                  <Clock size={11} />
                  {new Date(selectedFeedback.created_at).toLocaleString()}
                </span>
              </div>

              <p className={styles.modalBody}>{selectedFeedback.feedback}</p>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalDeleteBtn}
                  onClick={() => {
                    setSelectedFeedback(null);
                    setFeedbackToDelete(selectedFeedback.id);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setFeedbackToDelete(null); }}
        onConfirm={confirmDeleteFeedback}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
