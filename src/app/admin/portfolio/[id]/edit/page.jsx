"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Trash2,
  Upload,
} from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import be from "../../../blogs/BlogEditor.module.css";
import s from "./page.module.css";
import AdminFormSkeleton from "@/components/Skeletons/AdminFormSkeleton";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import { seoKeywordsFromInput, seoKeywordsToInput } from "@/lib/seo/auto";
import { isUuid } from "@/lib/utils/isUuid";

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

export default function EditPortfolioPage() {
  const router = useRouter();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    image: "",
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
    created_at: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingVisibility, setEditingVisibility] = useState(false);
  const [rowId, setRowId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchPortfolio() {
      setErrorMsg(null);
      setRowId(null);
      const param = String(id || "").trim();
      if (!param || /^null$/i.test(param) || /^undefined$/i.test(param)) {
        setErrorMsg(
          "Invalid project link. Open the project from the portfolio admin list.",
        );
        showAppToast("Invalid project link.", "error");
        setLoading(false);
        return;
      }

      const { data, error } = isUuid(param)
        ? await supabase.from("portfolios").select("*").eq("id", param).single()
        : await supabase
            .from("portfolios")
            .select("*")
            .eq("slug", param)
            .single();

      if (error) {
        setErrorMsg(error.message);
        showAppToast(error.message || "Could not load portfolio item.", "error");
      } else {
        setRowId(data.id);
        setFormData({
          title: data.title || "",
          image: data.image || "",
          category: data.category || "",
          description: data.description || "",
          overview: data.overview || "",
          problem_statement: data.problem_statement || "",
          challenges: data.challenges || "",
          achievements: data.achievements || "",
          key_features: data.key_features || "",
          live_url: data.live_url || "",
          repo_url: data.repo_url || "",
          status: data.status || "Completed",
          technologies: data.technologies || "",
          focus_keyword: data.focus_keyword || "",
          seo_keywords: seoKeywordsToInput(data.seo_keywords),
          meta_title: data.meta_title || "",
          meta_description: data.meta_description || "",
          display_order:
            data.display_order != null ? String(data.display_order) : "",
          publish_status: data.publish_status || "published",
          visibility: data.visibility || "public",
          created_at: data.created_at || "",
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

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setErrorMsg(uploadError.message);
      showAppToast(uploadError.message || "Image upload failed.", "error");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("portfolio-images")
      .getPublicUrl(fileName);

    setFormData((prev) => ({ ...prev, image: data.publicUrl }));
    showAppToast("Image uploaded.", "success");
    setUploading(false);
  }

  function handleDeleteImage() {
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteImage() {
    if (!formData.image) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      const isSupabaseImage =
        formData.image.includes("supabase.co") &&
        formData.image.includes("portfolio-images");

      if (isSupabaseImage) {
        const urlParts = formData.image.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const { error: deleteError } = await supabase.storage
          .from("portfolio-images")
          .remove([fileName]);
        if (deleteError) {
          console.log("Storage deletion failed:", deleteError.message);
        }
      }

      setFormData((prev) => ({ ...prev, image: "" }));
      showAppToast("Cover image removed.", "success");
    } catch (error) {
      const msg = "Error deleting image: " + error.message;
      setErrorMsg(msg);
      showAppToast(msg, "error");
    }

    setUploading(false);
    setShowDeleteConfirm(false);
  }

  async function confirmDeleteProject() {
    if (!rowId) return;
    setSaving(true);

    try {
      if (formData.image) {
        const isSupabaseImage =
          formData.image.includes("supabase.co") &&
          formData.image.includes("portfolio-images");
        if (isSupabaseImage) {
          const urlParts = formData.image.split("/");
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage.from("portfolio-images").remove([fileName]);
        }
      }

      const { error } = await supabase
        .from("portfolios")
        .delete()
        .eq("id", rowId);

      if (error) {
        showAppToast(error.message || "Could not delete project.", "error");
        setSaving(false);
      } else {
        showAppToast("Project deleted.", "success");
        router.push("/admin/portfolio");
      }
    } catch (err) {
      showAppToast("Error: " + err.message, "error");
      setSaving(false);
    }

    setShowDeleteProjectConfirm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rowId) {
      showAppToast("Portfolio is not loaded yet.", "error");
      return;
    }
    setSaving(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from("portfolios")
      .update({
        title: formData.title,
        image: formData.image,
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
      })
      .eq("id", rowId);

    if (error) {
      setErrorMsg(error.message);
      showAppToast(error.message || "Could not update portfolio item.", "error");
    } else {
      showAppToast("Portfolio updated successfully.", "success");
      router.push("/admin/portfolio");
    }
    setSaving(false);
  }

  if (loading) return <AdminFormSkeleton />;

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
          <div className={be.heroMeta}>
            <p className={admin.eyebrow}>Showcase</p>
            <span className={be.metaChip}>Editing</span>
          </div>
          <h1 className={admin.pageTitle}>Edit portfolio project</h1>
          <p className={admin.lead}>
            Update copy, media, links, status, and SEO for this project.
          </p>
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
                    <label className={admin.fieldLabel} htmlFor="ep-title">
                      Project title
                    </label>
                    <input
                      id="ep-title"
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
                    <label className={admin.fieldLabel} htmlFor="ep-description">
                      Short description
                    </label>
                    <textarea
                      id="ep-description"
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
                      <label className={admin.fieldLabel} htmlFor="ep-overview">
                        Project overview
                      </label>
                      <textarea
                        id="ep-overview"
                        name="overview"
                        value={formData.overview}
                        onChange={handleChange}
                        className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="ep-problem">
                        Problem statement
                      </label>
                      <textarea
                        id="ep-problem"
                        name="problem_statement"
                        value={formData.problem_statement}
                        onChange={handleChange}
                        className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="ep-challenges">
                        Challenges &amp; solutions
                      </label>
                      <textarea
                        id="ep-challenges"
                        name="challenges"
                        value={formData.challenges}
                        onChange={handleChange}
                        className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="ep-achievements">
                        Achievements
                      </label>
                      <textarea
                        id="ep-achievements"
                        name="achievements"
                        value={formData.achievements}
                        onChange={handleChange}
                        className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="ep-features">
                        Key features
                      </label>
                      <textarea
                        id="ep-features"
                        name="key_features"
                        value={formData.key_features}
                        onChange={handleChange}
                        className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
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
                  {/* Status row */}
                  <div className={s.publishRow}>
                    <span className={s.publishLabel}>Status</span>
                    {editingStatus ? (
                      <div className={s.publishInline}>
                        <select
                          name="publish_status"
                          value={formData.publish_status}
                          onChange={handleChange}
                          className={`${admin.fieldInput} ${admin.fieldSelect} ${s.publishSelect}`}
                          autoFocus
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                        </select>
                        <button
                          type="button"
                          className={s.publishCancel}
                          onClick={() => setEditingStatus(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className={s.publishValue}>
                        <span
                          className={`${s.publishBadge} ${
                            formData.publish_status === "published"
                              ? s.badgePublished
                              : s.badgeDraft
                          }`}
                        >
                          {formData.publish_status === "published"
                            ? "Published"
                            : "Draft"}
                        </span>
                        <button
                          type="button"
                          className={s.publishEdit}
                          onClick={() => setEditingStatus(true)}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Visibility row */}
                  <div className={s.publishRow}>
                    <span className={s.publishLabel}>Visibility</span>
                    {editingVisibility ? (
                      <div className={s.publishInline}>
                        <select
                          name="visibility"
                          value={formData.visibility}
                          onChange={handleChange}
                          className={`${admin.fieldInput} ${admin.fieldSelect} ${s.publishSelect}`}
                          autoFocus
                        >
                          <option value="public">Public</option>
                          <option value="registered">Registered only</option>
                        </select>
                        <button
                          type="button"
                          className={s.publishCancel}
                          onClick={() => setEditingVisibility(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className={s.publishValue}>
                        <span className={s.publishBadge}>
                          {formData.visibility === "public"
                            ? "Public"
                            : "Registered only"}
                        </span>
                        <button
                          type="button"
                          className={s.publishEdit}
                          onClick={() => setEditingVisibility(true)}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Published on row */}
                  <div className={s.publishRow}>
                    <span className={s.publishLabel}>Published on</span>
                    <span className={s.publishDate}>
                      {formData.created_at
                        ? new Date(formData.created_at).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—"}
                    </span>
                  </div>

                  <div className={s.publishDivider} />

                  {/* Actions */}
                  <div className={s.publishActions}>
                    <button
                      type="button"
                      onClick={() => setShowDeleteProjectConfirm(true)}
                      disabled={saving || uploading}
                      className={admin.btnDanger}
                    >
                      <Trash2 size={13} strokeWidth={2} />
                      Move to Trash
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploading}
                      className={`${admin.btnPrimary} ${s.publishSaveBtn}`}
                    >
                      {saving ? "Saving…" : "Update"}
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
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && !uploading && fileInputRef.current?.click()}
                    aria-label="Click to upload cover image"
                  >
                    {formData.image ? (
                      <>
                        <Image
                          src={formData.image}
                          alt={formData.title ? `Cover: ${formData.title}` : "Portfolio cover"}
                          width={640}
                          height={360}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                    id="ep-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="ep-upload" className={s.uploadBtn}>
                    <Upload size={13} strokeWidth={2} />
                    {uploading ? "Uploading…" : "Choose file"}
                  </label>
                  {formData.image && (
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      disabled={uploading}
                      className={admin.btnDanger}
                    >
                      {uploading ? "Deleting…" : "Remove cover image"}
                    </button>
                  )}
                </div>
              </div>

              {/* Settings: Status + Display order + Technologies */}
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
                      <label className={admin.fieldLabel} htmlFor="ep-status">
                        Status
                      </label>
                      <select
                        id="ep-status"
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
                        htmlFor="ep-display-order"
                      >
                        Order
                      </label>
                      <div className={s.orderTooltipWrap}>
                        <input
                          id="ep-display-order"
                          name="display_order"
                          type="number"
                          min="1"
                          value={formData.display_order}
                          onChange={handleChange}
                          className={s.orderInput}
                          placeholder="—"
                          aria-label="Display order"
                        />
                        <span className={s.orderTooltip}>1 = first, blank = by date</span>
                      </div>
                    </div>
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="ep-technologies">
                      Technologies
                    </label>
                    <input
                      id="ep-technologies"
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
                      <label className={admin.fieldLabel} htmlFor="ep-live-url">
                        Live website URL
                      </label>
                      <input
                        id="ep-live-url"
                        name="live_url"
                        value={formData.live_url}
                        onChange={handleChange}
                        className={admin.fieldInput}
                        placeholder="https://…"
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="ep-repo-url">
                        Repo URL (optional)
                      </label>
                      <input
                        id="ep-repo-url"
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
                    <label className={admin.fieldLabel} htmlFor="ep-focus-kw">
                      Focus keyword
                    </label>
                    <input
                      id="ep-focus-kw"
                      name="focus_keyword"
                      value={formData.focus_keyword}
                      onChange={handleChange}
                      className={admin.fieldInput}
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="ep-seo-kw">
                      Supporting keywords
                    </label>
                    <input
                      id="ep-seo-kw"
                      name="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Comma-separated"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="ep-meta-title">
                      Meta title override
                    </label>
                    <input
                      id="ep-meta-title"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleChange}
                      className={admin.fieldInput}
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="ep-meta-desc">
                      Meta description override
                    </label>
                    <textarea
                      id="ep-meta-desc"
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
          title="Delete Image"
          message="Are you sure you want to delete this image? This action cannot be undone and the image will be permanently removed from storage."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
        <ConfirmationModal
          isOpen={showDeleteProjectConfirm}
          onClose={() => setShowDeleteProjectConfirm(false)}
          onConfirm={confirmDeleteProject}
          title="Delete Project"
          message="Are you sure you want to permanently delete this project? The cover image and all data will be removed and cannot be recovered."
          confirmText="Delete project"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </div>
  );
}
