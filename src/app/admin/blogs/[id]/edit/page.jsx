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
  PenLine,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import be from "../../BlogEditor.module.css";
import s from "./page.module.css";
import AdminFormSkeleton from "@/components/Skeletons/AdminFormSkeleton";
import { supabase } from "@/services/supabaseClient";
import RichEditor from "@/components/Admin/RichEditor/RichEditor";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import { seoKeywordsFromInput, seoKeywordsToInput } from "@/lib/seo/auto";
import { coverImageAltForBlog } from "@/lib/seo/blog";
import { optimizeImageFile } from "@/lib/images/optimizeImage";

export default function EditBlogPage() {
  const router = useRouter();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    image: "",
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
    created_at: "",
  });

  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [addingAuthor, setAddingAuthor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingVisibility, setEditingVisibility] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
    fetchBlog();
  }, [id]);

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

  async function fetchBlog() {
    setErrorMsg(null);
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setErrorMsg(error.message);
      showAppToast(error.message || "Could not load blog post.", "error");
    } else {
      setFormData({
        title: data.title,
        slug: data.slug,
        image: data.image,
        category_id: data.category_id || "",
        author_id: data.author_id || "",
        description: data.description,
        content: data.content,
        tags: data.tags || "",
        readTime: data.readTime || "",
        focus_keyword: data.focus_keyword || "",
        seo_keywords: seoKeywordsToInput(data.seo_keywords),
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        cover_image_alt: data.cover_image_alt || "",
        publish_status: data.publish_status || "published",
        visibility: data.visibility || "public",
        created_at: data.created_at || "",
      });
    }
    setLoading(false);
  }

  function handleChange(e) {
    setErrorMsg(null);
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  function handleTitleChange(e) {
    const title = e.target.value;
    const slug = slugify(title);
    setFormData({ ...formData, title, slug });
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);

    let uploadFile = file;
    try {
      uploadFile = await optimizeImageFile(file);
    } catch {
      uploadFile = file;
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
      setErrorMsg(uploadError.message);
      showAppToast(uploadError.message || "Image upload failed.", "error");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
    setFormData((prev) => ({ ...prev, image: data.publicUrl }));
    showAppToast("Cover image uploaded.", "success");
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
      const urlParts = formData.image.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const { error: deleteError } = await supabase.storage
        .from("blog-images")
        .remove([fileName]);
      if (deleteError) {
        const msg = "Error deleting image: " + deleteError.message;
        setErrorMsg(msg);
        showAppToast(msg, "error");
      } else {
        setFormData((prev) => ({ ...prev, image: "" }));
        showAppToast("Cover image removed.", "success");
      }
    } catch (error) {
      const msg = "Error deleting image: " + error.message;
      setErrorMsg(msg);
      showAppToast(msg, "error");
    }
    setUploading(false);
    setShowDeleteConfirm(false);
  }

  async function confirmDeletePost() {
    setSaving(true);
    try {
      if (formData.image) {
        const urlParts = formData.image.split("/");
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from("blog-images").remove([fileName]);
      }
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) {
        showAppToast(error.message || "Could not delete post.", "error");
        setSaving(false);
      } else {
        showAppToast("Post deleted.", "success");
        router.push("/admin/blogs");
      }
    } catch (err) {
      showAppToast("Error: " + err.message, "error");
      setSaving(false);
    }
    setShowDeletePostConfirm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const { data: existingSlugs } = await supabase
      .from("blogs")
      .select("slug")
      .eq("slug", formData.slug)
      .neq("id", id);

    const uniqueSlug =
      existingSlugs?.length > 0
        ? generateUniqueSlug(
            formData.title,
            existingSlugs.map((b) => b.slug),
          )
        : formData.slug;

    const coverAltSaved = coverImageAltForBlog({
      cover_image_alt: formData.cover_image_alt,
      title: formData.title,
    });

    const { error } = await supabase
      .from("blogs")
      .update({
        title: formData.title,
        slug: uniqueSlug,
        image: formData.image,
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
      })
      .eq("id", id);

    if (error) {
      setErrorMsg(error.message);
      showAppToast(error.message || "Could not update blog post.", "error");
    } else {
      showAppToast("Blog post updated successfully.", "success");
      router.push("/admin/blogs");
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
            <Link href="/admin/blogs" className={admin.backNav}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden />
              Back to blogs
            </Link>
          </div>
          <h1 className={admin.pageTitle}>Edit blog post</h1>
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
                      <label className={admin.fieldLabel} htmlFor="eb-title">
                        Title
                      </label>
                      <input
                        id="eb-title"
                        name="title"
                        value={formData.title}
                        onChange={handleTitleChange}
                        required
                        className={admin.fieldInput}
                        placeholder="Post headline"
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="eb-slug">
                        Slug
                      </label>
                      <input
                        id="eb-slug"
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
                    <label className={admin.fieldLabel} htmlFor="eb-desc">
                      Description
                    </label>
                    <textarea
                      id="eb-desc"
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
                      onClick={() => setShowDeletePostConfirm(true)}
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
                    onKeyDown={(e) =>
                      e.key === "Enter" && !uploading && fileInputRef.current?.click()
                    }
                    aria-label="Click to upload cover image"
                  >
                    {formData.image ? (
                      <>
                        <Image
                          src={formData.image}
                          alt={coverImageAltForBlog({
                            cover_image_alt: formData.cover_image_alt,
                            title: formData.title,
                          })}
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
                    id="eb-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="eb-upload" className={s.uploadBtn}>
                    <Upload size={13} strokeWidth={2} />
                    {uploading ? "Uploading…" : "Choose file"}
                  </label>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="eb-cover-alt">
                      Alt text
                    </label>
                    <input
                      id="eb-cover-alt"
                      name="cover_image_alt"
                      value={formData.cover_image_alt}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Describe the image for SEO"
                    />
                  </div>
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
                      <label className={admin.fieldLabel} htmlFor="eb-category">
                        Category
                      </label>
                      <select
                        id="eb-category"
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
                      <label className={admin.fieldLabel} htmlFor="eb-author">
                        Author
                      </label>
                      <select
                        id="eb-author"
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
                      <label className={admin.fieldLabel} htmlFor="eb-tags">
                        Tags
                      </label>
                      <input
                        id="eb-tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        className={admin.fieldInput}
                        placeholder="Next.js, React…"
                      />
                    </div>
                    <div className={admin.formField}>
                      <label className={admin.fieldLabel} htmlFor="eb-read">
                        Read time (min)
                      </label>
                      <input
                        id="eb-read"
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
                  {/* Quick-add author */}
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
                    <label className={admin.fieldLabel} htmlFor="eb-focus-kw">
                      Focus keyword
                    </label>
                    <input
                      id="eb-focus-kw"
                      name="focus_keyword"
                      value={formData.focus_keyword}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Primary phrase for this post"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="eb-seo-kw">
                      Supporting keywords
                    </label>
                    <input
                      id="eb-seo-kw"
                      name="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Comma-separated"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="eb-meta-title">
                      Meta title override
                    </label>
                    <input
                      id="eb-meta-title"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleChange}
                      className={admin.fieldInput}
                    />
                  </div>
                  <div className={admin.formField}>
                    <label className={admin.fieldLabel} htmlFor="eb-meta-desc">
                      Meta description override
                    </label>
                    <textarea
                      id="eb-meta-desc"
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

      </div>

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
        isOpen={showDeletePostConfirm}
        onClose={() => setShowDeletePostConfirm(false)}
        onConfirm={confirmDeletePost}
        title="Delete Post"
        message="Are you sure you want to permanently delete this blog post? The cover image and all data will be removed and cannot be recovered."
        confirmText="Delete post"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
