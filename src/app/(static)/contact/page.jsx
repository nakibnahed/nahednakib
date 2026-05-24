"use client";

import { useState } from "react";
import styles from "./contact.module.css";

export default function ContactTabsPage() {
  const [activeTab, setActiveTab] = useState("contact");

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactError, setContactError] = useState("");

  // Newsletter form state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState("");
  const [newsletterError, setNewsletterError] = useState("");

  function handleContactChange(e) {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  }

  async function handleContactSubmit(e) {
    e.preventDefault();
    setContactLoading(true);
    setContactSuccess("");
    setContactError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setContactError(data.error || "Failed to send message");
      } else {
        setContactSuccess(data.message);
        setContactForm({ name: "", email: "", message: "" });
      }
    } catch (error) {
      setContactError("Failed to send message. Please try again.");
    } finally {
      setContactLoading(false);
    }
  }

  async function handleNewsletterSubmit(e) {
    e.preventDefault();
    setNewsletterLoading(true);
    setNewsletterSuccess("");
    setNewsletterError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewsletterError(data.error || "Failed to subscribe");
      } else {
        setNewsletterSuccess(data.message || "Subscribed successfully!");
        setNewsletterEmail("");
      }
    } catch (error) {
      setNewsletterError("Failed to subscribe. Please try again.");
    } finally {
      setNewsletterLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.contactCard}>
        {/* Tab Navigation */}
        <nav className={styles.tabNav}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "contact" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("contact")}
            type="button"
          >
            Contact
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "newsletter" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("newsletter")}
            type="button"
          >
            Newsletter
          </button>
        </nav>

        {/* Tab Content */}
        <div className={styles.tabContentWrapper}>
          <form
            onSubmit={handleContactSubmit}
            className={`${styles.contactForm} ${styles.tabContent} ${
              activeTab === "contact" ? styles.tabContentActive : ""
            }`}
            style={{ display: activeTab === "contact" ? "flex" : "none" }}
          >
            <h1 className={styles.title}>Get in Touch</h1>
            <p className={styles.description}>Feel free to reach out to me.</p>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={contactForm.name}
              onChange={handleContactChange}
              required
              className={styles.input}
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={contactForm.email}
              onChange={handleContactChange}
              required
              className={styles.input}
            />
            <textarea
              name="message"
              placeholder="Your Message"
              value={contactForm.message}
              onChange={handleContactChange}
              required
              className={styles.textarea}
            />
            <button
              type="submit"
              disabled={contactLoading}
              className={styles.submitBtn}
            >
              {contactLoading ? "Sending..." : "Send Message"}
            </button>
            {contactSuccess && (
              <p className={styles.successMsg}>{contactSuccess}</p>
            )}
            {contactError && <p className={styles.errorMsg}>{contactError}</p>}
          </form>

          <form
            onSubmit={handleNewsletterSubmit}
            className={`${styles.contactForm} ${styles.tabContent} ${
              activeTab === "newsletter" ? styles.tabContentActive : ""
            }`}
            style={{ display: activeTab === "newsletter" ? "flex" : "none" }}
          >
            <h1 className={styles.title}>Subscribe Now</h1>
            <p className={styles.description}>Subscribe to Newsletter</p>
            <input
              type="email"
              name="newsletterEmail"
              placeholder="Your Email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className={styles.input}
            />
            <button
              type="submit"
              disabled={newsletterLoading}
              className={styles.submitBtn}
            >
              {newsletterLoading ? "Subscribing..." : "Subscribe"}
            </button>
            {newsletterSuccess && (
              <p className={styles.successMsg}>{newsletterSuccess}</p>
            )}
            {newsletterError && (
              <p className={styles.errorMsg}>{newsletterError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
