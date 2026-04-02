"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import { seoKeywordsFromInput } from "@/lib/seo/auto";

const CATEGORY_OPTIONS = [
  "Web Development",
  "Mobile App",
  "UI/UX",
  "Backend",
  "Full Stack",
  "Marketing",
  "Data Science",
  "Other",
];

export default function NewPortfolioPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    imageFile: null,
    category: "",
    description: "",
    overview: "",
    achievements: "",
    key_features: "",
    live_url: "",
    repo_url: "",
    status: "Completed",
    technologies: "",
    focus_keyword: "",
    seo_keywords: "",
    meta_title: "",
    meta_description: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setFormData({ ...formData, imageFile: e.target.files[0] || null });
  }

  function handleDeleteImage() {
    setShowDeleteConfirm(true);
  }

  function confirmDeleteImage() {
    setFormData({ ...formData, imageFile: null });
    setShowDeleteConfirm(false);
    showAppToast("Cover image removed.", "success");
  }

  function handleCategoryChange(e) {
    const value = e.target.value;
    let selected = formData.category
      ? formData.category.split(",").map((c) => c.trim())
      : [];
    if (e.target.checked) {
      if (!selected.includes(value)) selected.push(value);
    } else {
      selected = selected.filter((c) => c !== value);
    }
    setFormData({ ...formData, category: selected.join(", ") });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let imageUrl = "";

    if (formData.imageFile) {
      try {
        const fileExt = formData.imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("portfolio-images")
          .upload(filePath, formData.imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: formData.imageFile.type,
          });

        if (uploadError) {
          const msg = "Image upload failed: " + uploadError.message;
          setErrorMsg(msg);
          showAppToast(msg, "error");
          setLoading(false);
          return;
        }

        const { data: publicData, error: urlError } = supabase.storage
          .from("portfolio-images")
          .getPublicUrl(filePath);

        if (urlError) {
          const msg = "Failed to get image URL: " + urlError.message;
          setErrorMsg(msg);
          showAppToast(msg, "error");
          setLoading(false);
          return;
        }

        imageUrl = publicData.publicUrl;
      } catch (uploadError) {
        const msg = "Image upload failed: " + uploadError.message;
        setErrorMsg(msg);
        showAppToast(msg, "error");
        setLoading(false);
        return;
      }
    }

    const createdDate = new Date().toLocaleString();

    const { data: createdPortfolio, error } = await supabase
      .from("portfolios")
      .insert([
        {
          title: formData.title,
          image: imageUrl,
          date: createdDate,
          category: formData.category,
          description: formData.description,
          overview: formData.overview,
          achievements: formData.achievements,
          key_features: formData.key_features,
          live_url: formData.live_url,
          repo_url: formData.repo_url,
          status: formData.status,
          technologies: formData.technologies,
          focus_keyword: formData.focus_keyword.trim() || null,
          seo_keywords: seoKeywordsFromInput(formData.seo_keywords),
          meta_title: formData.meta_title.trim() || null,
          meta_description: formData.meta_description.trim() || null,
        },
      ])
      .select("id")
      .single();

    if (error) {
      setErrorMsg(error.message);
      showAppToast(error.message || "Could not create portfolio item.", "error");
    } else {
      showAppToast("Portfolio created successfully.", "success");
      // Send notification to all users about new portfolio item
      try {
        await fetch("/api/admin/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "New Portfolio Project! 🚀",
            message: `Check out our latest project: \"${formData.title}\"`,
            type: "new_portfolio_post",
            recipient_type: "all_users",
            related_content_type: "portfolio",
            related_content_id: createdPortfolio?.id || null,
          }),
        });
      } catch (error) {
        console.error("Error sending portfolio notification:", error);
      }
      router.push("/admin/portfolio");
    }
    setLoading(false);
  }

  return (
    <div className={admin.page}>
      <div className={admin.entityForm}>
        <header className={admin.pageHeader}>
          <p className={admin.eyebrow}>Showcase</p>
          <h1 className={admin.pageTitle}>New portfolio project</h1>
          <p className={admin.lead}>
            Add a project card with imagery, story, links, and SEO.
          </p>
        </header>

        <section className={admin.filtersSection} aria-label="Back">
          <Link href="/admin/portfolio" className={admin.backNav}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            Back to portfolio
          </Link>
        </section>

        {errorMsg && (
          <div className={admin.formErrorBanner} role="alert">
            {errorMsg}
          </div>
        )}

        <div className={admin.formCard}>
          <form onSubmit={handleSubmit} className={admin.formStack}>
        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Title:</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={admin.fieldInput}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Image Upload:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={admin.fieldInput}
          />
          {formData.imageFile && (
            <div className={admin.imageThumbWrap}>
              <p className={admin.fieldHelp}>Selected: {formData.imageFile.name}</p>
              <button
                type="button"
                onClick={handleDeleteImage}
                className={admin.btnDanger}
              >
                Remove image
              </button>
            </div>
          )}
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Categories:</label>
          <div className={admin.checkboxGrid}>
            {CATEGORY_OPTIONS.map((cat) => (
              <label key={cat} className={admin.checkboxLabel}>
                <input
                  type="checkbox"
                  value={cat}
                  checked={
                    formData.category
                      ? formData.category
                          .split(",")
                          .map((c) => c.trim())
                          .includes(cat)
                      : false
                  }
                  onChange={handleCategoryChange}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={admin.fieldTextarea}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Project Overview (HTML):</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            className={admin.fieldTextarea}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Achievements (HTML):</label>
          <textarea
            name="achievements"
            value={formData.achievements}
            onChange={handleChange}
            className={admin.fieldTextarea}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Key Features (HTML):</label>
          <textarea
            name="key_features"
            value={formData.key_features}
            onChange={handleChange}
            className={admin.fieldTextarea}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Live Website URL:</label>
          <input
            name="live_url"
            value={formData.live_url}
            onChange={handleChange}
            className={admin.fieldInput}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Repo URL (optional):</label>
          <input
            name="repo_url"
            value={formData.repo_url}
            onChange={handleChange}
            className={admin.fieldInput}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Status:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`${admin.fieldInput} ${admin.fieldSelect}`}
          >
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Paused">Paused</option>
            <option value="Planned">Planned</option>
          </select>
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>
            Technologies (comma-separated):
          </label>
          <input
            name="technologies"
            value={formData.technologies}
            onChange={handleChange}
            className={admin.fieldInput}
            placeholder="e.g. React, Next.js, Supabase"
          />
        </div>

        <div className={admin.formField}>
          <h2 className={admin.formSubheading}>SEO (optional)</h2>
          <p className={admin.fieldHelp}>
            Leave blank to auto-generate titles and descriptions. Supporting
            keywords feed structured data only.
          </p>
          <label className={admin.fieldLabel}>Focus keyword</label>
          <input
            name="focus_keyword"
            value={formData.focus_keyword}
            onChange={handleChange}
            className={admin.fieldInput}
          />
          <label className={admin.fieldLabel}>Supporting keywords</label>
          <input
            name="seo_keywords"
            value={formData.seo_keywords}
            onChange={handleChange}
            className={admin.fieldInput}
            placeholder="Comma-separated"
          />
          <label className={admin.fieldLabel}>Meta title override</label>
          <input
            name="meta_title"
            value={formData.meta_title}
            onChange={handleChange}
            className={admin.fieldInput}
          />
          <label className={admin.fieldLabel}>Meta description override</label>
          <textarea
            name="meta_description"
            value={formData.meta_description}
            onChange={handleChange}
            className={admin.fieldTextarea}
            rows={3}
          />
        </div>

        <div className={admin.formActions}>
          <button type="submit" disabled={loading} className={admin.btnPrimary}>
            {loading ? "Saving…" : "Create project"}
          </button>
        </div>
      </form>
        </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteImage}
        title="Remove Image"
        message="Are you sure you want to remove this image? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        type="warning"
      />
      </div>
    </div>
  );
}
