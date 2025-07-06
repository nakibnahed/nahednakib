"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import styles from "./NewBlog.module.css"; // Rename to NewBlog.module.css if you wish

export default function NewBlogPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    imageFile: null,
    category: "",
    description: "",
    content: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setFormData({ ...formData, imageFile: e.target.files[0] || null });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let imageUrl = "";

    if (formData.imageFile) {
      const fileExt = formData.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, formData.imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: formData.imageFile.type,
        });

      if (uploadError) {
        setErrorMsg("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      imageUrl = publicData.publicUrl;
    }

    const createdDate = new Date().toLocaleString();

    const { error } = await supabase.from("blogs").insert([
      {
        title: formData.title,
        image: imageUrl,
        date: createdDate,
        category: formData.category,
        description: formData.description,
        content: formData.content,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
    } else {
      // Send notification to all users about new blog post
      try {
        await fetch("/api/admin/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "New Blog Post Published! 📝",
            message: `Check out our latest blog post: "${formData.title}"`,
            type: "blog",
            isGlobal: true,
          }),
        });
      } catch (error) {
        console.error("Error sending blog notification:", error);
      }
      router.push("/admin/blogs");
    }
    setLoading(false);
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Create New Blog</h1>

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
          <label className={styles.label}>Image Upload:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
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

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "Saving..." : "Create"}
        </button>
      </form>
    </div>
  );
}
