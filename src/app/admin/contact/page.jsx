"use client";

import styles from "./ContactAdmin.module.css";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

export default function ContactPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageTitle}>Contact Form Submissions</h1>

      {loading && <p>Loading...</p>}

      {error && <p className={styles.error}>Error loading messages: {error}</p>}

      {!loading && !error && messages.length === 0 && <p>No messages found.</p>}

      {!loading && !error && messages.length > 0 && (
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
              {messages.map((msg) => (
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
