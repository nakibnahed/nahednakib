"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlignLeft,
  ArrowLeft,
  FileText,
  ImageIcon,
  Layers,
  Link2,
  Search,
} from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import be from "../../blogs/BlogEditor.module.css";
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
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

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
      <div className={be.pageRoot}>
        <header className={be.hero}>
          <div className={be.heroBack}>
            <Link href="/admin/portfolio" className={admin.backNav}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden />
              Back to portfolio
            </Link>
          </div>
          <div className={be.heroMeta}>
            <p className={admin.eyebrow}>Showcase</p>
            <span className={be.metaChip}>New project</span>
          </div>
          <h1 className={admin.pageTitle}>New portfolio project</h1>
          <p className={admin.lead}>
            Add a project card with imagery, story, links, and SEO.
          </p>
        </header>

        {errorMsg && (
          <div className={admin.formErrorBanner} role="alert">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`${admin.formStack} ${be.formFlow}`}
        >
          <section
            className={be.section}
            aria-labelledby="new-portfolio-section-basics"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <FileText size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Basics</p>
                <h2 id="new-portfolio-section-basics" className={be.sectionTitle}>
                  Title
                </h2>
                <p className={be.sectionLead}>
                  The project name shown on cards and detail pages.
                </p>
              </div>
            </div>
            <div className={admin.formField}>
              <label className={admin.fieldLabel} htmlFor="new-portfolio-title">
                Title
              </label>
              <input
                id="new-portfolio-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className={admin.fieldInput}
              />
            </div>
          </section>

          <section
            className={be.section}
            aria-labelledby="new-portfolio-section-media"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <ImageIcon size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Media</p>
                <h2 id="new-portfolio-section-media" className={be.sectionTitle}>
                  Cover image
                </h2>
                <p className={be.sectionLead}>
                  Hero image for the portfolio grid and project page.
                </p>
              </div>
            </div>
            <div className={be.mediaPreview}>
              {coverPreviewUrl ? (
                <div className={be.previewFrame}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverPreviewUrl}
                    alt={formData.title ? `Preview: ${formData.title}` : "Cover preview"}
                    style={{ maxWidth: "100%", height: "auto", display: "block" }}
                  />
                </div>
              ) : (
                <div className={be.emptyMedia}>No file selected yet.</div>
              )}
              <div className={admin.formField} style={{ flex: "1 1 220px" }}>
                <label
                  className={admin.fieldLabel}
                  htmlFor="new-portfolio-upload"
                >
                  Upload image
                </label>
                <input
                  id="new-portfolio-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={`${admin.fieldInput} ${be.fileInput}`}
                />
                {formData.imageFile && (
                  <>
                    <p className={admin.fieldHelp}>
                      Selected: {formData.imageFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className={admin.btnDanger}
                    >
                      Remove image
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          <section
            className={be.section}
            aria-labelledby="new-portfolio-section-taxonomy"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <Layers size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Classification</p>
                <h2
                  id="new-portfolio-section-taxonomy"
                  className={be.sectionTitle}
                >
                  Categories
                </h2>
                <p className={be.sectionLead}>
                  One or more labels for filtering and related projects.
                </p>
              </div>
            </div>
            <div className={admin.formField}>
              <span className={admin.fieldLabel}>Categories</span>
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
          </section>

          <section
            className={be.section}
            aria-labelledby="new-portfolio-section-story"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <AlignLeft size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Story</p>
                <h2 id="new-portfolio-section-story" className={be.sectionTitle}>
                  Description &amp; HTML blocks
                </h2>
                <p className={be.sectionLead}>
                  Short summary plus rich HTML sections for the project page.
                </p>
              </div>
            </div>
            <div className={admin.formField}>
              <label
                className={admin.fieldLabel}
                htmlFor="new-portfolio-description"
              >
                Description
              </label>
              <textarea
                id="new-portfolio-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={admin.fieldTextarea}
              />
            </div>
            <div className={admin.formField}>
              <label
                className={admin.fieldLabel}
                htmlFor="new-portfolio-overview"
              >
                Project overview (HTML)
              </label>
              <textarea
                id="new-portfolio-overview"
                name="overview"
                value={formData.overview}
                onChange={handleChange}
                className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
              />
            </div>
            <div className={admin.formField}>
              <label
                className={admin.fieldLabel}
                htmlFor="new-portfolio-achievements"
              >
                Achievements (HTML)
              </label>
              <textarea
                id="new-portfolio-achievements"
                name="achievements"
                value={formData.achievements}
                onChange={handleChange}
                className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
              />
            </div>
            <div className={admin.formField}>
              <label
                className={admin.fieldLabel}
                htmlFor="new-portfolio-key-features"
              >
                Key features (HTML)
              </label>
              <textarea
                id="new-portfolio-key-features"
                name="key_features"
                value={formData.key_features}
                onChange={handleChange}
                className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
              />
            </div>
          </section>

          <section
            className={be.section}
            aria-labelledby="new-portfolio-section-links"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <Link2 size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Links &amp; status</p>
                <h2 id="new-portfolio-section-links" className={be.sectionTitle}>
                  URLs, status &amp; stack
                </h2>
                <p className={be.sectionLead}>
                  Live demo, repository, delivery status, and technologies.
                </p>
              </div>
            </div>
            <div className={be.grid2}>
              <div className={admin.formField}>
                <label
                  className={admin.fieldLabel}
                  htmlFor="new-portfolio-live-url"
                >
                  Live website URL
                </label>
                <input
                  id="new-portfolio-live-url"
                  name="live_url"
                  value={formData.live_url}
                  onChange={handleChange}
                  className={admin.fieldInput}
                />
              </div>
              <div className={admin.formField}>
                <label
                  className={admin.fieldLabel}
                  htmlFor="new-portfolio-repo-url"
                >
                  Repo URL (optional)
                </label>
                <input
                  id="new-portfolio-repo-url"
                  name="repo_url"
                  value={formData.repo_url}
                  onChange={handleChange}
                  className={admin.fieldInput}
                />
              </div>
              <div className={admin.formField}>
                <label
                  className={admin.fieldLabel}
                  htmlFor="new-portfolio-status"
                >
                  Status
                </label>
                <select
                  id="new-portfolio-status"
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
                <label
                  className={admin.fieldLabel}
                  htmlFor="new-portfolio-technologies"
                >
                  Technologies (comma-separated)
                </label>
                <input
                  id="new-portfolio-technologies"
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleChange}
                  className={admin.fieldInput}
                  placeholder="e.g. React, Next.js, Supabase"
                />
              </div>
            </div>
          </section>

          <section
            className={be.section}
            aria-labelledby="new-portfolio-section-seo"
          >
            <div className={be.seoSection}>
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <Search size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>SEO</p>
                  <h2 id="new-portfolio-section-seo" className={be.sectionTitle}>
                    Search &amp; metadata (optional)
                  </h2>
                  <p className={be.sectionLead}>
                    Leave blank to auto-generate titles and descriptions.
                    Supporting keywords feed structured data only.
                  </p>
                </div>
              </div>
              <div className={be.seoFields}>
                <div className={admin.formField}>
                  <label
                    className={admin.fieldLabel}
                    htmlFor="new-portfolio-focus-kw"
                  >
                    Focus keyword
                  </label>
                  <input
                    id="new-portfolio-focus-kw"
                    name="focus_keyword"
                    value={formData.focus_keyword}
                    onChange={handleChange}
                    className={admin.fieldInput}
                  />
                </div>
                <div className={admin.formField}>
                  <label
                    className={admin.fieldLabel}
                    htmlFor="new-portfolio-seo-kw"
                  >
                    Supporting keywords
                  </label>
                  <input
                    id="new-portfolio-seo-kw"
                    name="seo_keywords"
                    value={formData.seo_keywords}
                    onChange={handleChange}
                    className={admin.fieldInput}
                    placeholder="Comma-separated"
                  />
                </div>
                <div className={admin.formField}>
                  <label
                    className={admin.fieldLabel}
                    htmlFor="new-portfolio-meta-title"
                  >
                    Meta title override
                  </label>
                  <input
                    id="new-portfolio-meta-title"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleChange}
                    className={admin.fieldInput}
                  />
                </div>
                <div className={admin.formField}>
                  <label
                    className={admin.fieldLabel}
                    htmlFor="new-portfolio-meta-desc"
                  >
                    Meta description override
                  </label>
                  <textarea
                    id="new-portfolio-meta-desc"
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleChange}
                    className={admin.fieldTextarea}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className={be.stickyActions}>
            <button type="submit" disabled={loading} className={admin.btnPrimary}>
              {loading ? "Saving…" : "Create project"}
            </button>
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
