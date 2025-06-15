"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import styles from "./EditPortfolio.module.css";

export default function EditPortfolioPage() {
  const router = useRouter();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    image: "",
    category: "",
    description: "",
    content: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchPortfolio() {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else {
        setFormData({
          title: data.title,
          image: data.image,
          category: data.category,
          description: data.description,
          content: data.content,
        });
      }
      setLoading(false);
    }
    fetchPortfolio();
  }, [id]);

  function handleChange(e) {
    setErrorMsg(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type, // important for fixing 400 error
      });

    if (uploadError) {
      setErrorMsg(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("portfolio-images")
      .getPublicUrl(filePath);

    setFormData((prev) => ({ ...prev, image: data.publicUrl }));
    setUploading(false);
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
          <label className={styles.label}>Current Image:</label>
          {formData.image ? (
            <img
              src={formData.image}
              alt="Portfolio image"
              style={{
                maxWidth: "200px",
                display: "block",
                marginBottom: "10px",
              }}
            />
          ) : (
            <p>No image uploaded yet</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Upload New Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.input}
            disabled={uploading}
          />
          {uploading && <p>Uploading image...</p>}
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

        <button
          type="submit"
          disabled={saving || uploading}
          className={styles.submitBtn}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
