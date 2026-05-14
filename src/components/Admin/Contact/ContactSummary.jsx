"use client";

import admin from "@/components/Admin/adminPage.module.css";
import styles from "./ContactSummary.module.css";
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/services/supabaseClient";
import * as XLSX from "xlsx";
import { Download, Mail, MessageSquare, Users, FolderOpen, X, Copy, Check, ChevronLeft, ChevronRight, FileSpreadsheet, FileJson } from "lucide-react";

const PAGE_SIZE = 10;

export default function ContactPage() {
  const [contactMessages, setContactMessages] = useState([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [projectInquiries, setProjectInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForm, setSelectedForm] = useState("contact");
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportMenu]);

  // Lock scroll on both html and body, handle Escape
  useEffect(() => {
    if (!selectedItem) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setSelectedItem(null); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      document.removeEventListener("keydown", onKey);
    };
  }, [selectedItem]);

  const formTypes = [
    {
      id: "contact",
      name: "Contact Form",
      icon: MessageSquare,
      description: "Contact form submissions",
    },
    {
      id: "project",
      name: "Project Inquiries",
      icon: FolderOpen,
      description: "Project inquiry submissions",
    },
    {
      id: "newsletter",
      name: "Newsletter",
      icon: Mail,
      description: "Newsletter subscribers",
    },
  ];

  useEffect(() => {
    fetchData();
  }, [selectedForm]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    if (selectedForm === "contact") {
      await fetchContactMessages();
    } else if (selectedForm === "project") {
      await fetchProjectInquiries();
    } else if (selectedForm === "newsletter") {
      await fetchNewsletterSubscribers();
    }

    setLoading(false);
  }

  async function fetchContactMessages() {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setContactMessages([]);
    } else {
      setContactMessages(data);
      setError(null);
    }
  }

  async function fetchProjectInquiries() {
    const { data, error } = await supabase
      .from("project_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setProjectInquiries([]);
    } else {
      setProjectInquiries(data);
      setError(null);
    }
  }

  async function fetchNewsletterSubscribers() {
    try {
      const res = await fetch("/api/newsletter");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load newsletter subscribers");
        setNewsletterSubscribers([]);
      } else {
        setNewsletterSubscribers(json.subscribers);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      setNewsletterSubscribers([]);
    }
  }

  // Get current data and filtered results based on selected form
  const getCurrentData = () => {
    if (selectedForm === "contact") return contactMessages;
    if (selectedForm === "project") return projectInquiries;
    if (selectedForm === "newsletter") return newsletterSubscribers;
    return [];
  };

  const currentData = getCurrentData();

  // useMemo to memoize filtered data for performance
  const filteredData = useMemo(() => {
    if (!searchTerm) return currentData;
    const lowerTerm = searchTerm.toLowerCase();

    if (selectedForm === "contact") {
      return currentData.filter(
        (msg) =>
          (msg.name && msg.name.toLowerCase().includes(lowerTerm)) ||
          (msg.email && msg.email.toLowerCase().includes(lowerTerm)) ||
          (msg.message && msg.message.toLowerCase().includes(lowerTerm)),
      );
    } else if (selectedForm === "project") {
      return currentData.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
          (item.email && item.email.toLowerCase().includes(lowerTerm)) ||
          (item.project_type && item.project_type.toLowerCase().includes(lowerTerm)) ||
          (item.description && item.description.toLowerCase().includes(lowerTerm)),
      );
    } else if (selectedForm === "newsletter") {
      return currentData.filter(
        (sub) =>
          (sub.email && sub.email.toLowerCase().includes(lowerTerm)) ||
          (sub.id && sub.id.toLowerCase().includes(lowerTerm)),
      );
    }
    return [];
  }, [currentData, searchTerm, selectedForm]);

  // Reset to page 1 whenever form type or search changes
  useEffect(() => { setCurrentPage(1); }, [selectedForm, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pagedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Export helpers ──
  const getExportRows = () => {
    if (selectedForm === "project") {
      return filteredData.map((item) => ({
        Name: item.name,
        Email: item.email,
        "Project Type": item.project_type,
        Description: item.description || "",
        Features: item.features || "",
        Timeline: item.timeline || "",
        Notes: item.notes || "",
        "Submitted On": item.created_at ? new Date(item.created_at).toLocaleString() : "",
      }));
    }
    if (selectedForm === "contact") {
      return filteredData.map((msg) => ({
        Name: msg.name,
        Email: msg.email,
        Message: msg.message,
        "Sent On": msg.created_at ? new Date(msg.created_at).toLocaleString() : "",
      }));
    }
    if (selectedForm === "newsletter") {
      return filteredData.map((sub) => ({
        Email: sub.email,
        Status: sub.subscribed ? "Active" : "Unsubscribed",
        "Subscribed Date": sub.subscribed_at || sub.created_at ? new Date(sub.subscribed_at || sub.created_at).toLocaleDateString() : "",
        "Unsubscribed Date": sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleDateString() : "",
      }));
    }
    return [];
  };

  const baseFilename = `${selectedForm}_${new Date().toISOString().split("T")[0]}`;

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
    XLSX.utils.book_append_sheet(wb, ws, selectedForm);
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

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentFormType = () => formTypes.find((f) => f.id === selectedForm);
  const currentFormType = getCurrentFormType();

  // Get statistics
  const getStats = () => {
    if (selectedForm === "contact") {
      return {
        total: contactMessages.length,
        recent: contactMessages.filter((m) => {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          return new Date(m.created_at) > dayAgo;
        }).length,
      };
    } else if (selectedForm === "project") {
      return {
        total: projectInquiries.length,
        recent: projectInquiries.filter((m) => {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          return new Date(m.created_at) > dayAgo;
        }).length,
      };
    } else if (selectedForm === "newsletter") {
      return {
        total: newsletterSubscribers.length,
        active: newsletterSubscribers.filter((s) => s.subscribed).length,
        unsubscribed: newsletterSubscribers.filter((s) => !s.subscribed).length,
      };
    }
    return { total: 0 };
  };

  const stats = getStats();

  return (
    <div className={`${admin.page} ${styles.mainContainer}`}>
      <header className={admin.pageHeader}>
        <p className={admin.eyebrow}>Inbound</p>
        <h1 className={admin.pageTitle}>Forms</h1>
        <p className={admin.lead}>
          Manage all form submissions and subscriber data.
        </p>
      </header>

      <section className={admin.statsSection} aria-label="Summary">
        <div className={admin.statsGrid}>
          {(selectedForm === "contact" || selectedForm === "project") && (
            <>
              <div className={admin.statCard}>
                {selectedForm === "contact" ? <MessageSquare size={24} /> : <FolderOpen size={24} />}
                <div>
                  <h3>{stats.total}</h3>
                  <p>Total</p>
                </div>
              </div>
              <div className={admin.statCard}>
                <Users size={24} />
                <div>
                  <h3>{stats.recent}</h3>
                  <p>Last 24h</p>
                </div>
              </div>
            </>
          )}

          {selectedForm === "newsletter" && (
            <>
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
                  <h3>{stats.active}</h3>
                  <p>Active</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className={admin.filtersSection} aria-label="Filters">
      <div className={styles.controlsRow}>
        <div className={styles.filters}>
          <select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            className={styles.formSelector}
          >
            {formTypes.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder={`Search ${currentFormType?.name.toLowerCase()}...`}
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>

        {totalPages > 1 && (
          <div className={styles.paginationInline}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

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

      {loading && (
        <div className={styles.loading}>
          Loading {currentFormType?.name.toLowerCase()}...
        </div>
      )}

      {error && <p className={styles.error}>Error loading data: {error}</p>}

      {!loading &&
        !error &&
        filteredData.length === 0 &&
        currentData.length > 0 && (
          <div className={styles.noData}>
            {currentFormType && <currentFormType.icon size={48} />}
            <p>
              No {currentFormType?.name.toLowerCase()} found matching "
              {searchTerm}"
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        filteredData.length === 0 &&
        currentData.length === 0 && (
          <div className={styles.noData}>
            {currentFormType && <currentFormType.icon size={48} />}
            <p>No {currentFormType?.name.toLowerCase()} found</p>
          </div>
        )}

      {!loading && !error && filteredData.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {selectedForm === "contact" && (
                  <>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Message</th>
                    <th>Sent On</th>
                  </>
                )}
                {selectedForm === "project" && (
                  <>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Project Type</th>
                    <th>Timeline</th>
                    <th>Submitted On</th>
                  </>
                )}
                {selectedForm === "newsletter" && (
                  <>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Subscribed Date</th>
                    <th>Unsubscribed Date</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {pagedData.map((item) => (
                <tr
                  key={item.id}
                  className={selectedForm !== "newsletter" ? styles.clickableRow : undefined}
                  onClick={selectedForm !== "newsletter" ? () => setSelectedItem(item) : undefined}
                >
                  {selectedForm === "contact" && (
                    <>
                      <td data-label="Name">{item.name}</td>
                      <td data-label="Email">{item.email}</td>
                      <td data-label="Message" className={styles.truncatedCell}>
                        {item.message?.length > 80
                          ? item.message.slice(0, 80) + "…"
                          : item.message}
                      </td>
                      <td data-label="Sent On">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "-"}
                      </td>
                    </>
                  )}
                  {selectedForm === "project" && (
                    <>
                      <td data-label="Name">{item.name}</td>
                      <td data-label="Email">{item.email}</td>
                      <td data-label="Project Type">{item.project_type}</td>
                      <td data-label="Timeline">{item.timeline || "-"}</td>
                      <td data-label="Submitted On">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "-"}
                      </td>
                    </>
                  )}
                  {selectedForm === "newsletter" && (
                    <>
                      <td data-label="Email" className={styles.emailCell}>
                        <div className={styles.emailInfo}>
                          <Mail size={16} />
                          {item.email}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span
                          className={`${styles.statusBadge} ${
                            item.subscribed ? styles.active : styles.inactive
                          }`}
                        >
                          {item.subscribed ? "Active" : "Unsubscribed"}
                        </span>
                      </td>
                      <td data-label="Subscribed">
                        {item.subscribed_at || item.created_at
                          ? new Date(
                              item.subscribed_at || item.created_at,
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td data-label="Unsubscribed">
                        {item.unsubscribed_at
                          ? new Date(item.unsubscribed_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.pageInfo}>
            {currentPage} / {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {selectedItem && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderInfo}>
                <h2 className={styles.modalName}>{selectedItem.name}</h2>
                <div className={styles.modalEmailRow}>
                  <a
                    href={`mailto:${selectedItem.email}`}
                    className={styles.modalEmail}
                  >
                    {selectedItem.email}
                  </a>
                  <button
                    className={styles.copyBtn}
                    aria-label="Copy email"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.email);
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }}
                  >
                    {copiedEmail ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
              <button
                className={styles.modalClose}
                onClick={() => setSelectedItem(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {selectedForm === "project" && (
              <div className={styles.modalBody}>
                <div className={styles.modalMeta}>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaLabel}>Project Type</span>
                    <span className={styles.modalMetaValue}>{selectedItem.project_type}</span>
                  </div>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaLabel}>Timeline</span>
                    <span className={styles.modalMetaValue}>{selectedItem.timeline || "—"}</span>
                  </div>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaLabel}>Submitted</span>
                    <span className={styles.modalMetaValue}>
                      {selectedItem.created_at
                        ? new Date(selectedItem.created_at).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className={styles.modalField}>
                  <span className={styles.modalFieldLabel}>Description</span>
                  <p className={styles.modalFieldValue}>
                    {selectedItem.description || "—"}
                  </p>
                </div>

                {selectedItem.features && (
                  <div className={styles.modalField}>
                    <span className={styles.modalFieldLabel}>Features</span>
                    <p className={styles.modalFieldValue}>
                      {selectedItem.features}
                    </p>
                  </div>
                )}

                {selectedItem.notes && selectedItem.notes !== "-" && (
                  <div className={styles.modalField}>
                    <span className={styles.modalFieldLabel}>Notes</span>
                    <p className={styles.modalFieldValue}>
                      {selectedItem.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedForm === "contact" && (
              <div className={styles.modalBody}>
                <div className={styles.modalMeta}>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaLabel}>Sent</span>
                    <span className={styles.modalMetaValue}>
                      {selectedItem.created_at
                        ? new Date(selectedItem.created_at).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className={styles.modalField}>
                  <span className={styles.modalFieldLabel}>Message</span>
                  <p className={styles.modalFieldValue}>
                    {selectedItem.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
