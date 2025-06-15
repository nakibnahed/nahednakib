"use client";

import styles from "./ContactSummary.module.css";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/services/supabaseClient";

export default function ContactPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setMessages([]);
    } else {
      setMessages(data);
      setError(null);
    }
    setLoading(false);
  }

  // useMemo to memoize filtered messages for performance
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    const lowerTerm = searchTerm.toLowerCase();
    return messages.filter(
      (msg) =>
        (msg.name && msg.name.toLowerCase().includes(lowerTerm)) ||
        (msg.email && msg.email.toLowerCase().includes(lowerTerm)) ||
        (msg.message && msg.message.toLowerCase().includes(lowerTerm))
    );
  }, [messages, searchTerm]);

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageTitle}>Contact Form Submissions</h1>

      <input
        type="text"
        placeholder="Search by name, email or message..."
        className={styles.searchInput}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        autoComplete="off"
      />

      {loading && <p>Loading...</p>}

      {error && <p className={styles.error}>Error loading messages: {error}</p>}

      {!loading && !error && filteredMessages.length === 0 && (
        <p>No messages found.</p>
      )}

      {!loading && !error && filteredMessages.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
                <th>Sent On</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => (
                <tr key={msg.id}>
                  <td>{msg.name}</td>
                  <td>{msg.email}</td>
                  <td style={{ maxWidth: "300px", wordWrap: "break-word" }}>
                    {msg.message}
                  </td>
                  <td>
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleString()
                      : "-"}
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
