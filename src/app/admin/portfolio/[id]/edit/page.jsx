"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/services/supabaseClient"; // Correct path
import styles from "./EditPortfolio.module.css";

export default function EditPortfolioPage() {
  const router = useRouter();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    image: "",
    date: "",
    category: "",
    description: "",
    content: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function fetchPortfolio() {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        setErrorMsg(error.message);
      } else {
        setFormData(data);
      }
      setLoading(false);
    }
    fetchPortfolio();
  }, [id]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from("portfolios")
      .update({
        title: formData.title,
        image: formData.image,
        date: formData.date,
        category: formData.category,
        description: formData.description,
        content: formData.content,
      })
      .eq("id", id);

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push("/admin/portfolio");
    }
    setSaving(false);
  }

  if (loading) return <p>Loading portfolio data...</p>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Edit Portfolio</h1>

      {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Title:</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Image URL:</label>
          <input
            name="image"
            value={formData.image}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Date:</label>
          <input
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Category:</label>
          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Content (HTML):</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>

        <button type="submit" disabled={saving} className={styles.submitBtn}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
