"use client"; // since we'll use hooks

import { useState } from "react";
import { supabase } from "@/services/supabaseClient";

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

    // Insert data into Supabase
    const { data, error } = await supabase.from("contact_messages").insert([
      {
        name: formData.name,
        email: formData.email,
        message: formData.message,
      },
    ]);

    setLoading(false);

    if (error) {
      setErrorMsg("Failed to send message. Please try again.");
      console.error(error);
    } else {
      setSuccessMsg("Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
    }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Get in Touch</h1>
      <p className={styles.description}>Feel free to reach out to me.</p>

      <div className={styles.contactCard}>
        <div className={styles.contactItem}>
          <span>
            <strong>Phone:</strong> (+90) 534 681 0886
          </span>
        </div>

        <div className={styles.contactItem}>
          <span>
            <strong>Email:</strong> nahednakibyos@gmail.com
          </span>
        </div>

        {/* Contact Form */}
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
