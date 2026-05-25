"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlignLeft,
  ArrowLeft,
  Calendar,
  FileText,
  ImageIcon,
  Layers,
  Link2,
  Search,
  Settings,
  Upload,
} from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import be from "../../blogs/BlogEditor.module.css";
import s from "./page.module.css";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import { seoKeywordsFromInput } from "@/lib/seo/auto";
import { generateUniqueSlug } from "@/lib/utils/slugify";
import RichEditor from "@/components/Admin/RichEditor/RichEditor";

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
    problem_statement: "",
    challenges: "",
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
    display_order: "",
    publish_status: "published",
    visibility: "public",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!formData.imageFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(formData.imageFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.imageFile]);

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

        const { error: uploadError } = await supabase.storage
          .from("portfolio-images")
          .upload(fileName, formData.imageFile, {
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
          .getPublicUrl(fileName);

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

    const { data: slugRows, error: slugFetchError } = await supabase
      .from("portfolios")
      .select("slug");

    if (slugFetchError) {
      const msg = "Could not prepare slug: " + slugFetchError.message;
      setErrorMsg(msg);
      showAppToast(msg, "error");
      setLoading(false);
      return;
    }

    const existingSlugs = (slugRows || []).map((r) => r.slug).filter(Boolean);
    const slug =
      generateUniqueSlug(formData.title || "project", existingSlugs) ||
      `portfolio-${Date.now()}`;

    const { data: createdPortfolio, error } = await supabase
      .from("portfolios")
      .insert([
        {
          title: formData.title,
          slug,
          image: imageUrl,
          date: new Date().toLocaleString(),
          category: formData.category,
          description: formData.description,
          overview: formData.overview,
          problem_statement: formData.problem_statement,
          challenges: formData.challenges,
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
          display_order:
            formData.display_order !== ""
              ? parseInt(formData.display_order, 10)
              : null,
          publish_status: formData.publish_status,
          visibility: formData.visibility,
        },
      ])
      .select("id")
      .single();

    if (error) {
      setErrorMsg(error.message);
      showAppToast(error.message || "Could not create portfolio item.", "error");
    } else {
      showAppToast("Portfolio created successfully.", "success");
      if (formData.publish_status === "published") {
        try {
          await fetch("/api/admin/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
      }
      router.push("/admin/portfolio");
    }
    setLoading(false);
  }

  return (
    <div className={admin.page}>
      <div className={be.pageRoot}>

        {/* ── Header ── */}
        <header className={be.hero}>
          <div className={be.heroBack}>
            <Link href="/admin/portfolio" className={admin.backNav}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden />
              Back to portfolio
            </Link>
          </div>
          <h1 className={admin.pageTitle}>New portfolio project</h1>
        </header>

        {errorMsg && (
          <div className={admin.formErrorBanner} role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={s.editGrid}>

            {/* ════════════ MAIN column ════════════ */}
            <div className={s.main}>

              {/* Title */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <FileText size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Title</p>
                </div>
                <div className={s.cardBody}>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="np-title">
                      Project title
                    </label>
                    <input
                      id="np-title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className={admin.fieldInput}
                      placeholder="e.g. E-commerce Redesign"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <FileText size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Summary</p>
                </div>
                <div className={s.cardBody}>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="np-description">
                      Short description
                    </label>
                    <textarea
                      id="np-description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className={admin.fieldTextarea}
                      placeholder="One or two sentences shown on the portfolio card."
                    />
                  </div>
                </div>
              </div>

              {/* HTML Content blocks */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <AlignLeft size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Content blocks (HTML)</p>
                </div>
                <div className={s.cardBody}>
                  <div className={s.htmlStack}>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel}>
                        Project overview
                      </label>
                      <RichEditor
                        content={formData.overview}
                        onChange={(val) => setFormData((prev) => ({ ...prev, overview: val }))}
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel}>
                        Problem statement
                      </label>
                      <RichEditor
                        content={formData.problem_statement}
                        onChange={(val) => setFormData((prev) => ({ ...prev, problem_statement: val }))}
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel}>
                        Challenges &amp; solutions
                      </label>
                      <RichEditor
                        content={formData.challenges}
                        onChange={(val) => setFormData((prev) => ({ ...prev, challenges: val }))}
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel}>
                        Achievements
                      </label>
                      <RichEditor
                        content={formData.achievements}
                        onChange={(val) => setFormData((prev) => ({ ...prev, achievements: val }))}
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel}>
                        Key features
                      </label>
                      <RichEditor
                        content={formData.key_features}
                        onChange={(val) => setFormData((prev) => ({ ...prev, key_features: val }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
            {/* ════════════ end MAIN ════════════ */}

            {/* ════════════ SIDEBAR ════════════ */}
            <div className={s.sidebar}>

              {/* Publish */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <Calendar size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Publish</p>
                </div>
                <div className={s.cardBody}>
                  <div className={s.publishRow}>
                    <span className={s.publishLabel}>Status</span>
                    <select
                      name="publish_status"
                      value={formData.publish_status}
                      onChange={handleChange}
                      className={`${admin.fieldInput} ${admin.fieldSelect} ${s.publishSelect}`}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div className={s.publishRow}>
                    <span className={s.publishLabel}>Visibility</span>
                    <select
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleChange}
                      className={`${admin.fieldInput} ${admin.fieldSelect} ${s.publishSelect}`}
                    >
                      <option value="public">Public</option>
                      <option value="registered">Registered only</option>
                    </select>
                  </div>
                  <div className={s.publishDivider} />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`${admin.btnPrimary} ${s.publishSaveBtn}`}
                    >
                      {loading ? "Saving…" : "Create project"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cover image */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <ImageIcon size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Cover image</p>
                </div>
                <div className={s.cardBody}>
                  <div
                    className={s.imgPreview}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && fileInputRef.current?.click()
                    }
                    aria-label="Click to upload cover image"
                  >
                    {coverPreviewUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverPreviewUrl}
                          alt={
                            formData.title
                              ? `Preview: ${formData.title}`
                              : "Cover preview"
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <div className={s.imgOverlay}>
                          <Upload size={18} strokeWidth={2} />
                          <span>Change image</span>
                        </div>
                      </>
                    ) : (
                      <div className={s.imgEmpty}>
                        <Upload size={22} strokeWidth={1.5} />
                        <span>Click to upload</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    id="np-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="np-upload" className={s.uploadBtn}>
                    <Upload size={13} strokeWidth={2} />
                    Choose file
                  </label>
                  {formData.imageFile && (
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className={admin.btnDanger}
                    >
                      Remove cover image
                    </button>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <Settings size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Settings</p>
                </div>
                <div className={s.cardBody}>
                  <div className={s.settingsRow}>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="np-status">
                        Status
                      </label>
                      <select
                        id="np-status"
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
                    <div className={s.orderWrap}>
                      <label
                        className={admin.fieldLabel}
                        htmlFor="np-display-order"
                      >
                        Order
                      </label>
                      <div className={s.orderTooltipWrap}>
                        <input
                          id="np-display-order"
                          name="display_order"
                          type="number"
                          min="1"
                          value={formData.display_order}
                          onChange={handleChange}
                          className={s.orderInput}
                          placeholder="—"
                          aria-label="Display order"
                        />
                        <span className={s.orderTooltip}>
                          1 = first, blank = by date
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={admin.formField}>
                    <label
                      className={admin.fieldLabel}
                      htmlFor="np-technologies"
                    >
                      Technologies
                    </label>
                    <input
                      id="np-technologies"
                      name="technologies"
                      value={formData.technologies}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="React, Next.js, Supabase…"
                    />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <Link2 size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Links</p>
                </div>
                <div className={s.cardBody}>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="np-live-url">
                      Live website URL
                    </label>
                    <input
                      id="np-live-url"
                      name="live_url"
                      value={formData.live_url}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="https://…"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="np-repo-url">
                      Repo URL (optional)
                    </label>
                    <input
                      id="np-repo-url"
                      name="repo_url"
                      value={formData.repo_url}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="https://github.com/…"
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <Layers size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Categories</p>
                </div>
                <div className={s.cardBody}>
                  <div className={s.checkPills}>
                    {CATEGORY_OPTIONS.map((cat) => {
                      const checked = formData.category
                        .split(",")
                        .map((c) => c.trim())
                        .includes(cat);
                      return (
                        <label
                          key={cat}
                          className={`${s.checkPill} ${checked ? s.checkPillActive : ""}`}
                        >
                          <input
                            type="checkbox"
                            value={cat}
                            checked={checked}
                            onChange={handleCategoryChange}
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <Search size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>SEO (optional)</p>
                </div>
                <div className={s.cardBody}>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="np-focus-kw">
                      Focus keyword
                    </label>
                    <input
                      id="np-focus-kw"
                      name="focus_keyword"
                      value={formData.focus_keyword}
                      onChange={handleChange}
                      className={admin.fieldInput}
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="np-seo-kw">
                      Supporting keywords
                    </label>
                    <input
                      id="np-seo-kw"
                      name="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Comma-separated"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="np-meta-title">
                      Meta title override
                    </label>
                    <input
                      id="np-meta-title"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleChange}
                      className={admin.fieldInput}
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="np-meta-desc">
                      Meta description override
                    </label>
                    <textarea
                      id="np-meta-desc"
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleChange}
                      className={admin.fieldTextarea}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

            </div>
            {/* ════════════ end SIDEBAR ════════════ */}

          </div>
        </form>

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
