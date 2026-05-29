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
  PenLine,
  Search,
  Upload,
} from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import be from "../BlogEditor.module.css";
import s from "./page.module.css";
import { supabase } from "@/services/supabaseClient";
import RichEditor from "@/components/Admin/RichEditor/RichEditor";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import { seoKeywordsFromInput } from "@/lib/seo/auto";
import { coverImageAltForBlog } from "@/lib/seo/blog";
import { optimizeImageFile } from "@/lib/images/optimizeImage";

export default function NewBlogPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    imageFile: null,
    category_id: "",
    author_id: "",
    description: "",
    content: "",
    tags: "",
    readTime: "",
    focus_keyword: "",
    seo_keywords: "",
    meta_title: "",
    meta_description: "",
    cover_image_alt: "",
    publish_status: "published",
    visibility: "public",
  });

  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [addingAuthor, setAddingAuthor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

  useEffect(() => {
    if (!formData.imageFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(formData.imageFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.imageFile]);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } else {
      setCategories(data);
    }
  }

  async function fetchAuthors() {
    const { data, error } = await supabase
      .from("authors")
      .select("id, name")
      .order("name");
    if (error) {
      console.error("Error fetching authors:", error);
      setAuthors([]);
    } else {
      setAuthors(data || []);
    }
  }

  async function handleAddAuthorQuick(e) {
    e.preventDefault();
    const name = newAuthorName.trim();
    if (!name) return;
    setAddingAuthor(true);
    try {
      const res = await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json.error || "Could not create author (main admin only).";
        setErrorMsg(msg);
        showAppToast(msg, "error");
        return;
      }
      setNewAuthorName("");
      await fetchAuthors();
      if (json.author?.id) {
        setFormData((prev) => ({ ...prev, author_id: json.author.id }));
      }
      showAppToast("Author added and selected.", "success");
    } catch (err) {
      const msg = err.message || "Failed to add author";
      setErrorMsg(msg);
      showAppToast(msg, "error");
    } finally {
      setAddingAuthor(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  function handleTitleChange(e) {
    const title = e.target.value;
    const slug = slugify(title);
    setFormData({ ...formData, title, slug });
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

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data: existingSlugs } = await supabase
      .from("blogs")
      .select("slug")
      .eq("slug", formData.slug);

    const uniqueSlug =
      existingSlugs?.length > 0
        ? generateUniqueSlug(
            formData.title,
            existingSlugs.map((b) => b.slug),
          )
        : formData.slug;

    let imageUrl = "";

    const coverAltSaved = coverImageAltForBlog({
      cover_image_alt: formData.cover_image_alt,
      title: formData.title,
    });

    if (formData.imageFile) {
      let uploadFile = formData.imageFile;
      try {
        uploadFile = await optimizeImageFile(formData.imageFile, { maxSizeMB: 0.3, maxWidthOrHeight: 1200 });
      } catch {
        uploadFile = formData.imageFile;
      }
      const fileExt = uploadFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, uploadFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: uploadFile.type || "image/jpeg",
        });

      if (uploadError) {
        const msg = "Image upload failed: " + uploadError.message;
        setErrorMsg(msg);
        showAppToast(msg, "error");
        setLoading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);

      imageUrl = publicData.publicUrl;
    }

    const { data: createdBlog, error } = await supabase
      .from("blogs")
      .insert([
        {
          title: formData.title,
          slug: uniqueSlug,
          image: imageUrl,
          date: new Date().toLocaleString(),
          category_id: formData.category_id || null,
          author_id: formData.author_id || null,
          description: formData.description,
          content: formData.content,
          tags: formData.tags.trim() || "Web Development",
          readTime: formData.readTime ? parseInt(formData.readTime) : null,
          focus_keyword: formData.focus_keyword.trim() || null,
          seo_keywords: seoKeywordsFromInput(formData.seo_keywords),
          meta_title: formData.meta_title.trim() || null,
          meta_description: formData.meta_description.trim() || null,
          cover_image_alt: coverAltSaved,
          publish_status: formData.publish_status,
          visibility: formData.visibility,
          published: formData.publish_status === "published",
        },
      ])
      .select("id")
      .single();

    if (error) {
      setErrorMsg(error.message);
      showAppToast(error.message || "Could not create blog post.", "error");
    } else {
      showAppToast("Blog post created successfully.", "success");
      if (formData.publish_status === "published") {
      try {
        const response = await fetch("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "New Blog Post Published! 📝",
            message: `Check out our latest blog post: "${formData.title}"`,
            type: "new_blog_post",
            recipient_type: "all_users",
            related_content_type: "blog",
            related_content_id: createdBlog?.id || null,
          }),
        });
        if (!response.ok) {
          console.error("Notification failed:", await response.text());
        }
      } catch (error) {
        console.error("Error sending blog notification:", error);
      }
      }
      if (formData.publish_status === "published") {
        try {
          await fetch("/api/newsletter/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blog: {
                id: createdBlog?.id,
                title: formData.title,
                slug: uniqueSlug,
                description: formData.description,
              },
            }),
          });
        } catch (error) {
          console.error("Error sending newsletter broadcast:", error);
        }
      }
      router.push("/admin/blogs");
    }
    setLoading(false);
  }

  return (
    <div className={admin.page}>
      <div className={be.pageRoot}>

        {/* ── Header ── */}
        <header className={be.hero}>
          <div className={be.heroBack}>
            <Link href="/admin/blogs" className={admin.backNav}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden />
              Back to blogs
            </Link>
          </div>
          <h1 className={admin.pageTitle}>New blog post</h1>
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

              {/* Title & Slug */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <FileText size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Title &amp; URL</p>
                </div>
                <div className={s.cardBody}>
                  <div className={s.fieldRow2}>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="nb-title">
                        Title
                      </label>
                      <input
                        id="nb-title"
                        name="title"
                        value={formData.title}
                        onChange={handleTitleChange}
                        required
                        className={admin.fieldInput}
                        placeholder="Post headline"
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="nb-slug">
                        Slug
                      </label>
                      <input
                        id="nb-slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        required
                        className={admin.fieldInput}
                        placeholder="url-friendly-slug"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <AlignLeft size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Excerpt</p>
                </div>
                <div className={s.cardBody}>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="nb-desc">
                      Description
                    </label>
                    <textarea
                      id="nb-desc"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className={admin.fieldTextarea}
                      placeholder="Short summary shown on listing cards and social previews."
                    />
                  </div>
                </div>
              </div>

              {/* Body — TinyMCE */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <PenLine size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Content (HTML)</p>
                </div>
                <div className={s.cardBody}>
                  <RichEditor
                    content={formData.content}
                    onChange={(val) => setFormData({ ...formData, content: val })}
                  />
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
                      {loading ? "Saving…" : "Create post"}
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
                          alt={coverImageAltForBlog({
                            cover_image_alt: formData.cover_image_alt,
                            title: formData.title,
                          })}
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
                    id="nb-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="nb-upload" className={s.uploadBtn}>
                    <Upload size={13} strokeWidth={2} />
                    Choose file
                  </label>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="nb-cover-alt">
                      Alt text
                    </label>
                    <input
                      id="nb-cover-alt"
                      name="cover_image_alt"
                      value={formData.cover_image_alt}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Describe the image for SEO"
                    />
                  </div>
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

              {/* Settings: category, author, tags, read time */}
              <div className={s.card}>
                <div className={s.cardHead}>
                  <span className={s.cardIcon} aria-hidden>
                    <Layers size={14} strokeWidth={2} />
                  </span>
                  <p className={s.cardTitle}>Settings</p>
                </div>
                <div className={s.cardBody}>
                  <div className={s.fieldRow2}>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="nb-category">
                        Category
                      </label>
                      <select
                        id="nb-category"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        className={`${admin.fieldInput} ${admin.fieldSelect}`}
                      >
                        <option value="">Select…</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="nb-author">
                        Author
                      </label>
                      <select
                        id="nb-author"
                        name="author_id"
                        value={formData.author_id}
                        onChange={handleChange}
                        className={`${admin.fieldInput} ${admin.fieldSelect}`}
                      >
                        <option value="">Select…</option>
                        {authors.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={s.fieldRow2}>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="nb-tags">
                        Tags
                      </label>
                      <input
                        id="nb-tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        className={admin.fieldInput}
                        placeholder="Next.js, React…"
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="nb-read">
                        Read time (min)
                      </label>
                      <input
                        id="nb-read"
                        name="readTime"
                        type="number"
                        min="1"
                        value={formData.readTime}
                        onChange={handleChange}
                        className={admin.fieldInput}
                        placeholder="Auto"
                      />
                    </div>
                  </div>
                  <div className={s.authorPanel}>
                    <p className={s.authorPanelLabel}>Quick add author</p>
                    <div className={s.authorRow}>
                      <input
                        type="text"
                        value={newAuthorName}
                        onChange={(e) => setNewAuthorName(e.target.value)}
                        placeholder="New author name"
                        className={admin.fieldInput}
                        aria-label="New author name"
                      />
                      <button
                        type="button"
                        onClick={handleAddAuthorQuick}
                        disabled={addingAuthor || !newAuthorName.trim()}
                        className={admin.btnPrimary}
                      >
                        {addingAuthor ? "Adding…" : "Add"}
                      </button>
                    </div>
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
                    <label className={admin.fieldLabel} htmlFor="nb-focus-kw">
                      Focus keyword
                    </label>
                    <input
                      id="nb-focus-kw"
                      name="focus_keyword"
                      value={formData.focus_keyword}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Primary phrase for this post"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="nb-seo-kw">
                      Supporting keywords
                    </label>
                    <input
                      id="nb-seo-kw"
                      name="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Comma-separated"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="nb-meta-title">
                      Meta title override
                    </label>
                    <input
                      id="nb-meta-title"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleChange}
                      className={admin.fieldInput}
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="nb-meta-desc">
                      Meta description override
                    </label>
                    <textarea
                      id="nb-meta-desc"
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
