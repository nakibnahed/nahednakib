"use client";

import styles from "./ContactSummary.module.css";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/services/supabaseClient";
import { Download, Mail, MessageSquare, Users } from "lucide-react";

export default function ContactPage() {
  const [contactMessages, setContactMessages] = useState([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForm, setSelectedForm] = useState("contact"); // contact, newsletter

  // Available forms configuration
  const formTypes = [
    {
      id: "contact",
      name: "Contact Form",
      icon: MessageSquare,
      description: "Contact form submissions",
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
          (msg.message && msg.message.toLowerCase().includes(lowerTerm))
      );
    } else if (selectedForm === "newsletter") {
      return currentData.filter(
        (sub) =>
          (sub.email && sub.email.toLowerCase().includes(lowerTerm)) ||
          (sub.id && sub.id.toLowerCase().includes(lowerTerm))
      );
    }
    return [];
  }, [currentData, searchTerm, selectedForm]);

  // Export functionality
  const exportData = () => {
    const currentFormType = formTypes.find((f) => f.id === selectedForm);

    if (selectedForm === "contact") {
      const csvContent = [
        "Name,Email,Message,Sent On",
        ...filteredData.map(
          (msg) =>
            `"${msg.name}","${msg.email}","${msg.message.replace(
              /"/g,
              '""'
            )}","${new Date(msg.created_at).toLocaleString()}"`
        ),
      ].join("\n");

      downloadCSV(
        csvContent,
        `contact_messages_${new Date().toISOString().split("T")[0]}.csv`
      );
    } else if (selectedForm === "newsletter") {
      const csvContent = [
        "Email,Status,Subscribed Date,Unsubscribed Date",
        ...filteredData.map(
          (sub) =>
            `"${sub.email}","${
              sub.subscribed ? "Active" : "Unsubscribed"
            }","${new Date(
              sub.subscribed_at || sub.created_at
            ).toLocaleDateString()}","${
              sub.unsubscribed_at
                ? new Date(sub.unsubscribed_at).toLocaleDateString()
                : ""
            }"`
        ),
      ].join("\n");

      downloadCSV(
        csvContent,
        `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv`
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
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Forms Management</h1>
          <p className={styles.subtitle}>
            Manage all form submissions and data
          </p>
        </div>

        <div className={styles.stats}>
          {selectedForm === "contact" && (
            <>
              <div className={styles.stat}>
                <MessageSquare size={20} />
                <div>
                  <div className={styles.statNumber}>{stats.total}</div>
                  <div className={styles.statLabel}>Total</div>
                </div>
              </div>
              <div className={styles.stat}>
                <Users size={20} />
                <div>
                  <div className={styles.statNumber}>{stats.recent}</div>
                  <div className={styles.statLabel}>Last 24h</div>
                </div>
              </div>
            </>
          )}

          {selectedForm === "newsletter" && (
            <>
              <div className={styles.stat}>
                <Users size={20} />
                <div>
                  <div className={styles.statNumber}>{stats.total}</div>
                  <div className={styles.statLabel}>Total</div>
                </div>
              </div>
              <div className={styles.stat}>
                <Mail size={20} />
                <div>
                  <div className={styles.statNumber}>{stats.active}</div>
                  <div className={styles.statLabel}>Active</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
                              item.subscribed_at || item.created_at
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
