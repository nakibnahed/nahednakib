"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "./NewsletterManagement.module.css";
import AdminListSkeleton from "@/components/Skeletons/AdminListSkeleton";
import { Mail, Trash2, Download, UserX, Users, FileSpreadsheet, FileJson } from "lucide-react";
import * as XLSX from "xlsx";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";

export default function NewsletterManagement() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, subscribed, unsubscribed
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);
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

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Filter subscribers based on search term and status
  const filteredSubscribers = useMemo(() => {
    let filtered = subscribers;

    // Filter by status
    if (filterStatus === "subscribed") {
      filtered = filtered.filter((sub) => sub.subscribed);
    } else if (filterStatus === "unsubscribed") {
      filtered = filtered.filter((sub) => !sub.subscribed);
    }

    // Filter by search term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          (sub.email && sub.email.toLowerCase().includes(lowerTerm)) ||
          (sub.id && sub.id.toLowerCase().includes(lowerTerm)) ||
          (sub.created_at && sub.created_at.toLowerCase().includes(lowerTerm)),
      );
    }

    return filtered;
  }, [subscribers, searchTerm, filterStatus]);

  const fetchSubscribers = async () => {
    try {
      const response = await fetch("/api/newsletter");
      const data = await response.json();

      if (response.ok) {
        setSubscribers(data.subscribers);
      } else {
        console.error("Error fetching subscribers:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteSubscriber = (subscriberId) => {
    setSubscriberToDelete(subscriberId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteSubscriber = async () => {
    if (!subscriberToDelete) return;

    try {
      const response = await fetch("/api/newsletter", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriberId: subscriberToDelete }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscribers(
          subscribers.filter((sub) => sub.id !== subscriberToDelete),
        );
        showAppToast("Subscriber removed.", "success");
      } else {
        showAppToast(data.error || "Could not remove subscriber.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showAppToast("Failed to delete subscriber.", "error");
    } finally {
      setShowDeleteConfirm(false);
      setSubscriberToDelete(null);
    }
  };

  const getExportRows = () =>
    filteredSubscribers.map((sub) => ({
      Email: sub.email,
      Status: sub.subscribed ? "Active" : "Unsubscribed",
      "Subscribed Date": sub.subscribed_at || sub.created_at
        ? new Date(sub.subscribed_at || sub.created_at).toLocaleDateString()
        : "",
      "Unsubscribed Date": sub.unsubscribed_at
        ? new Date(sub.unsubscribed_at).toLocaleDateString()
        : "",
    }));

  const baseFilename = `newsletter_${new Date().toISOString().split("T")[0]}`;

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
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
    XLSX.utils.book_append_sheet(wb, ws, "Newsletter");
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

  const stats = {
    total: subscribers.length,
    subscribed: subscribers.filter((sub) => sub.subscribed).length,
    unsubscribed: subscribers.filter((sub) => !sub.subscribed).length,
  };

  if (loading) {
    return <AdminListSkeleton />;
  }

  return (
    <div className={`${admin.page} ${styles.container}`}>
      <header className={admin.pageHeader}>
        <p className={admin.eyebrow}>Subscribers</p>
        <h1 className={admin.pageTitle}>Newsletter</h1>
        <p className={admin.lead}>
          Search, filter, export, and remove mailing list subscribers.
        </p>
      </header>

      <section className={admin.statsSection} aria-label="Summary">
        <div className={admin.statsGrid}>
          <div className={admin.statCard}>
            <Users size={24} />
            <div>
              <h3>{stats.total}</h3>
              <p>Total</p>
            </div>
          </div>
          <div className={admin.statCard}>
            <Mail size={24} />
            <div>
              <h3>{stats.subscribed}</h3>
              <p>Active</p>
            </div>
          </div>
          <div className={admin.statCard}>
            <UserX size={24} />
            <div>
              <h3>{stats.unsubscribed}</h3>
              <p>Unsubscribed</p>
            </div>
          </div>
        </div>
      </section>

      <section className={admin.filtersSection} aria-label="Search and filters">
      <div className={styles.controlsRow}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by email, ID or date..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="all">All Subscribers</option>
            <option value="subscribed">Active Only</option>
            <option value="unsubscribed">Unsubscribed Only</option>
          </select>
        </div>
        <div className={styles.exportWrap} ref={exportMenuRef}>
          <button
            className={styles.exportBtn}
            onClick={() => setShowExportMenu((v) => !v)}
          >
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

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Subscribed Date</th>
              <th>Unsubscribed Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <td className={styles.emailCell} data-label="Email">
                  <div className={styles.emailInfo}>
                    <Mail size={16} />
                    {subscriber.email}
                  </div>
                </td>
                <td className={styles.statusCell} data-label="Status">
                  <span
                    className={`${styles.statusBadge} ${
                      subscriber.subscribed ? styles.active : styles.inactive
                    }`}
                  >
                    {subscriber.subscribed ? "Active" : "Unsubscribed"}
                  </span>
                </td>
                <td className={styles.dateCell} data-label="Subscribed">
                  {subscriber.subscribed_at || subscriber.created_at
                    ? new Date(
                        subscriber.subscribed_at || subscriber.created_at,
                      ).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className={styles.dateCell} data-label="Unsubscribed">
                  {subscriber.unsubscribed_at
                    ? new Date(subscriber.unsubscribed_at).toLocaleDateString()
                    : "-"}
                </td>
                <td className={styles.actionsCell} data-label="Actions">
                  <div className={styles.actions}>
                    <button
                      onClick={() => confirmDeleteSubscriber(subscriber.id)}
                      className={styles.deleteBtn}
                      title="Delete subscriber"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSubscribers.length === 0 && subscribers.length > 0 ? (
          <div className={styles.noSubscribers}>
            <Mail size={48} />
            <p>No subscribers found matching "{searchTerm}"</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className={styles.noSubscribers}>
            <Mail size={48} />
            <p>No subscribers found</p>
          </div>
        ) : null}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteSubscriber}
        title="Delete Subscriber"
        message="Are you sure you want to delete this subscriber? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
