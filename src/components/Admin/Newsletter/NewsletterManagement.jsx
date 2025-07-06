"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./NewsletterManagement.module.css";
import { Mail, Trash2, Download, UserX, Users } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";

export default function NewsletterManagement() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, subscribed, unsubscribed
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);

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
          (sub.created_at && sub.created_at.toLowerCase().includes(lowerTerm))
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
          subscribers.filter((sub) => sub.id !== subscriberToDelete)
        );
        alert("Subscriber deleted successfully");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete subscriber");
    } finally {
      setShowDeleteConfirm(false);
      setSubscriberToDelete(null);
    }
  };

  const exportSubscribers = () => {
    const activeSubscribers = subscribers.filter((sub) => sub.subscribed);
    const csvContent = [
      "Email,Subscribed Date,Status",
      ...activeSubscribers.map(
        (sub) =>
          `${sub.email},${new Date(
            sub.subscribed_at || sub.created_at
          ).toLocaleDateString()},"Active"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter_subscribers_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: subscribers.length,
    subscribed: subscribers.filter((sub) => sub.subscribed).length,
    unsubscribed: subscribers.filter((sub) => !sub.subscribed).length,
  };

  if (loading) {
    return <div className={styles.loading}>Loading subscribers...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Newsletter Management</h1>
        <div className={styles.stats}>
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
              <div className={styles.statNumber}>{stats.subscribed}</div>
              <div className={styles.statLabel}>Active</div>
            </div>
          </div>
          <div className={styles.stat}>
            <UserX size={20} />
            <div>
              <div className={styles.statNumber}>{stats.unsubscribed}</div>
              <div className={styles.statLabel}>Unsubscribed</div>
            </div>
          </div>
        </div>
      </div>

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
        <button onClick={exportSubscribers} className={styles.exportBtn}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

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
                        subscriber.subscribed_at || subscriber.created_at
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
