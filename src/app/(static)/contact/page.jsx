"use client";

import { useState } from "react";
import styles from "./contact.module.css";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send message");
      } else {
        setSuccessMsg(data.message);
        setFormData({ name: "", email: "", message: "" });
      }
    } catch (error) {
      setErrorMsg("Failed to send message. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Get in Touch</h1>
      <p className={styles.description}>Feel free to reach out to me.</p>

      <div className={styles.contactCard}>
        <form onSubmit={handleSubmit} className={styles.contactForm}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            className={styles.input}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
            className={styles.input}
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            className={styles.textarea}
          />
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Sending..." : "Send Message"}
          </button>
          {successMsg && <p className={styles.successMsg}>{successMsg}</p>}
          {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
        </form>
      </div>
    </div>
  );
}
