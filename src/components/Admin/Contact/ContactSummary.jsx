"use client";

import admin from "@/components/Admin/adminPage.module.css";
import styles from "./ContactSummary.module.css";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/services/supabaseClient";
import { Download, Mail, MessageSquare, Users, FolderOpen } from "lucide-react";

export default function ContactPage() {
  const [contactMessages, setContactMessages] = useState([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [projectInquiries, setProjectInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForm, setSelectedForm] = useState("contact");

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
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setNewsletterSubscribers([]);
    } else {
      setNewsletterSubscribers(data);
      setError(null);
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

  // Export functionality
  const exportData = () => {
    const currentFormType = formTypes.find((f) => f.id === selectedForm);

    if (selectedForm === "project") {
      const csvContent = [
        "Name,Email,Project Type,Description,Features,Timeline,Notes,Submitted On",
        ...filteredData.map(
          (item) =>
            `"${item.name}","${item.email}","${item.project_type}","${(item.description || "").replace(/"/g, '""')}","${(item.features || "").replace(/"/g, '""')}","${item.timeline || ""}","${(item.notes || "").replace(/"/g, '""')}","${new Date(item.created_at).toLocaleString()}"`,
        ),
      ].join("\n");
      downloadCSV(
        csvContent,
        `project_inquiries_${new Date().toISOString().split("T")[0]}.csv`,
      );
    } else if (selectedForm === "contact") {
      const csvContent = [
        "Name,Email,Message,Sent On",
        ...filteredData.map(
          (msg) =>
            `"${msg.name}","${msg.email}","${msg.message.replace(
              /"/g,
              '""',
            )}","${new Date(msg.created_at).toLocaleString()}"`,
        ),
      ].join("\n");

      downloadCSV(
        csvContent,
        `contact_messages_${new Date().toISOString().split("T")[0]}.csv`,
      );
    } else if (selectedForm === "newsletter") {
      const csvContent = [
        "Email,Status,Subscribed Date,Unsubscribed Date",
        ...filteredData.map(
          (sub) =>
            `"${sub.email}","${
              sub.subscribed ? "Active" : "Unsubscribed"
            }","${new Date(
              sub.subscribed_at || sub.created_at,
            ).toLocaleDateString()}","${
              sub.unsubscribed_at
                ? new Date(sub.unsubscribed_at).toLocaleDateString()
                : ""
            }"`,
        ),
      ].join("\n");

      downloadCSV(
        csvContent,
        `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv`,
      );
    }
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
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

        <button onClick={exportData} className={styles.exportBtn}>
          <Download size={16} />
          Export CSV
        </button>
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
                    <th>Description</th>
                    <th>Features</th>
                    <th>Timeline</th>
                    <th>Notes</th>
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
              {filteredData.map((item) => (
                <tr key={item.id}>
                  {selectedForm === "contact" && (
                    <>
                      <td data-label="Name">{item.name}</td>
                      <td data-label="Email">{item.email}</td>
                      <td
                        data-label="Message"
                        style={{ maxWidth: "300px", wordWrap: "break-word" }}
                      >
                        {item.message}
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
                      <td data-label="Description" style={{ maxWidth: "220px", wordWrap: "break-word" }}>{item.description}</td>
                      <td data-label="Features" style={{ maxWidth: "180px", wordWrap: "break-word" }}>{item.features || "-"}</td>
                      <td data-label="Timeline">{item.timeline || "-"}</td>
                      <td data-label="Notes" style={{ maxWidth: "180px", wordWrap: "break-word" }}>{item.notes || "-"}</td>
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
    </div>
  );
}
