"use client";

import { useState } from "react";
import { supabase } from "@/services/supabaseClient";
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

  // Register form state (only email and password)
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerError, setRegisterError] = useState("");

  // Handlers for Contact Form
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

  // Handlers for Newsletter Form (no change yet)
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

  // Handlers for Register Form (Supabase direct)
  function handleRegisterChange(e) {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  }
  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterSuccess("");
    setRegisterError("");
    try {
      const { error } = await supabase.auth.signUp({
        email: registerForm.email,
        password: registerForm.password,
        options: {
          emailRedirectTo: "https://nahednakib.vercel.app/login?confirmed=1",
        },
      });
      if (error) {
        setRegisterError(error.message);
      } else {
        setRegisterSuccess("Registration successful! Please check your email.");
        setRegisterForm({ email: "", password: "" });
      }
    } catch (error) {
      setRegisterError("Failed to register. Please try again.");
    } finally {
      setRegisterLoading(false);
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
          <button
            className={`${styles.tabButton} ${
              activeTab === "register" ? styles.tabButtonActive : ""
            }`}
            onClick={() => setActiveTab("register")}
            type="button"
          >
            Register
          </button>
        </nav>

        {/* Tab Content with Animation */}
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
            <h1 className={styles.title}>Subscribe to Newsletter</h1>
            <p className={styles.description}>Get updates in your inbox.</p>
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

          <form
            onSubmit={handleRegisterSubmit}
            className={`${styles.contactForm} ${styles.tabContent} ${
              activeTab === "register" ? styles.tabContentActive : ""
            }`}
            style={{ display: activeTab === "register" ? "flex" : "none" }}
          >
            <h1 className={styles.title}>Register Now</h1>
            <p className={styles.description}>Create a new account.</p>
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              required
              className={styles.input}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={handleRegisterChange}
              required
              className={styles.input}
            />
            <button
              type="submit"
              disabled={registerLoading}
              className={styles.submitBtn}
            >
              {registerLoading ? "Registering..." : "Register"}
            </button>
            {registerSuccess && (
              <p className={styles.successMsg}>{registerSuccess}</p>
            )}
            {registerError && (
              <p className={styles.errorMsg}>{registerError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
