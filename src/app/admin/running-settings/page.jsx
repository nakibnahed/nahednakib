"use client";

import admin from "@/components/Admin/adminPage.module.css";
import { useState, useEffect } from "react";
import { Activity, HeartHandshake } from "lucide-react";
import styles from "./RunningSettings.module.css";

export default function RunningSettingsPage() {
  const [settings, setSettings] = useState({
    show_all_activities: false, // false = only public, true = all activities
    show_support_card: true, // true = show support card, false = hide it
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const response = await fetch("/api/running-settings");
      const data = await response.json();

      if (response.ok) {
        setSettings({
          show_all_activities: data.show_all_activities ?? false,
          show_support_card: data.show_support_card ?? true,
        });
      } else {
        console.error("Error fetching running settings:", data.error);
        setMessage("Error loading settings");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Error loading settings");
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/running-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        console.error("Error saving settings:", data.error);
        setMessage("Error saving settings");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("Error saving settings");
    }
    setSaving(false);
  }

  function handleToggleChange(field) {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  if (loading) {
    return (
      <div className={`${admin.page} ${styles.container}`}>
        <div className={admin.loadingPanel}>
          <div className={admin.loadingSpinner} aria-hidden />
          <span>Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${admin.page} ${styles.container}`}>
      <header className={admin.pageHeader}>
        <p className={admin.eyebrow}>Running</p>
        <h1 className={admin.pageTitle}>Strava display</h1>
        <p className={admin.lead}>
          Configure how Strava activities are displayed on your Running page.
        </p>
      </header>

      <section className={admin.statsSection} aria-label="Current values">
        <div className={admin.statsGrid}>
          <div className={admin.statCard}>
            <Activity size={24} aria-hidden />
            <div>
              <h3
                className={
                  settings.show_all_activities
                    ? admin.statCardValueLong
                    : undefined
                }
              >
                {settings.show_all_activities
                  ? "All (incl. private)"
                  : "Public only"}
              </h3>
              <p>Activities</p>
            </div>
          </div>
          <div className={admin.statCard}>
            <HeartHandshake size={24} aria-hidden />
            <div>
              <h3>{settings.show_support_card ? "Visible" : "Hidden"}</h3>
              <p>Support card</p>
            </div>
          </div>
        </div>
      </section>

      <section className={admin.filtersSection} aria-label="Filters" />

      <div className={styles.settingsCard}>
        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <h3 className={styles.settingTitle}>Activity Visibility</h3>
            <p className={styles.settingDescription}>
              Choose whether to show only public activities or all activities
              (public and private) from your Strava account.
            </p>
          </div>
          <div className={styles.settingControl}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.show_all_activities}
                onChange={() => handleToggleChange("show_all_activities")}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
            </label>
            <span className={styles.toggleLabel}>
              {settings.show_all_activities ? "All Activities" : "Public Only"}
            </span>
          </div>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <h3 className={styles.settingTitle}>Support Card Visibility</h3>
            <p className={styles.settingDescription}>
              Choose whether to show the "Why I Need Support" card in the
              sidebar on the running page.
            </p>
          </div>
          <div className={styles.settingControl}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.show_support_card}
                onChange={() => handleToggleChange("show_support_card")}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
            </label>
            <span className={styles.toggleLabel}>
              {settings.show_support_card
                ? "Show Support Card"
                : "Hide Support Card"}
            </span>
          </div>
        </div>

        {message && (
          <div
            className={`${styles.message} ${
              message.includes("Error") ? styles.error : styles.success
            }`}
          >
            {message}
          </div>
        )}

        <div className={styles.actions}>
          <button
            onClick={saveSettings}
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>Current Setting</h3>
        <p className={styles.infoText}>
          <strong>Activity Visibility:</strong>{" "}
          {settings.show_all_activities
            ? "Your info page will display all Strava activities (both public and private)."
            : "Your info page will display only public Strava activities."}
        </p>
        <p className={styles.infoText}>
          <strong>Support Card:</strong>{" "}
          {settings.show_support_card
            ? "The support card will be visible in the sidebar on the running page."
            : "The support card will be hidden from the sidebar on the running page."}
        </p>
      </div>
    </div>
  );
}
