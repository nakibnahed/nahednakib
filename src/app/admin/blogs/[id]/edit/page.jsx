"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlignLeft,
  ArrowLeft,
  FileText,
  ImageIcon,
  Layers,
  PenLine,
  Search,
} from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import be from "../../BlogEditor.module.css";
import { supabase } from "@/services/supabaseClient";
import { Editor } from "@tinymce/tinymce-react";
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
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(filePath, uploadFile, {
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

    const { data } = supabase.storage
      .from("blog-images")
      .getPublicUrl(filePath);

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
      // Extract filename from URL
      const urlParts = formData.image.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    // Generate unique slug (excluding current blog)
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

  if (loading) {
    return (
      <div className={admin.page}>
        <div className={be.pageRoot}>
          <div className={admin.loadingPanel}>
            <div className={admin.loadingSpinner} aria-hidden />
            <span>Loading blog…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={admin.page}>
      <div className={be.pageRoot}>
        <header className={be.hero}>
          <div className={be.heroBack}>
            <Link href="/admin/blogs" className={admin.backNav}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden />
              Back to blogs
            </Link>
          </div>
          <div className={be.heroMeta}>
            <p className={admin.eyebrow}>Content</p>
            <span className={be.metaChip}>Editing</span>
          </div>
          <h1 className={admin.pageTitle}>Edit blog post</h1>
          <p className={admin.lead}>
            Update the article, cover image, taxonomy, and SEO fields.
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
            <section className={be.section} aria-labelledby="edit-section-basics">
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <FileText size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Basics</p>
                  <h2 id="edit-section-basics" className={be.sectionTitle}>
                    Title &amp; URL
                  </h2>
                  <p className={be.sectionLead}>
                    The headline and slug used on the site and in share links.
                  </p>
                </div>
              </div>
              <div className={be.grid2}>
                <div className={admin.formField}>
                  <label className={admin.fieldLabel} htmlFor="edit-blog-title">
                    Title
                  </label>
                  <input
                    id="edit-blog-title"
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                    className={admin.fieldInput}
                  />
                </div>
                <div className={admin.formField}>
                  <label className={admin.fieldLabel} htmlFor="edit-blog-slug">
                    Slug
                  </label>
                  <input
                    id="edit-blog-slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                    className={admin.fieldInput}
                    placeholder="URL-friendly version of title"
                  />
                </div>
              </div>
            </section>

            <section
              className={be.section}
              aria-labelledby="edit-section-taxonomy"
            >
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <Layers size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Classification</p>
                  <h2 id="edit-section-taxonomy" className={be.sectionTitle}>
                    Category &amp; author
                  </h2>
                  <p className={be.sectionLead}>
                    Connect this post to a category and credit an author.
                  </p>
                </div>
              </div>
              <div className={be.grid2}>
                <div className={admin.formField}>
                  <label
                    className={admin.fieldLabel}
                    htmlFor="edit-blog-category"
                  >
                    Category
                  </label>
                  <select
                    id="edit-blog-category"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className={`${admin.fieldInput} ${admin.fieldSelect}`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={admin.formField}>
                  <label className={admin.fieldLabel} htmlFor="edit-blog-author">
                    Author
                  </label>
                  <select
                    id="edit-blog-author"
                    name="author_id"
                    value={formData.author_id}
                    onChange={handleChange}
                    className={`${admin.fieldInput} ${admin.fieldSelect}`}
                  >
                    <option value="">Select an author</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={be.authorCard}>
                <p className={be.authorCardLabel}>Quick add author</p>
                <p className={admin.fieldHelp}>
                  Manage authors in Admin → Authors. Main admin can add an author
                  here without leaving this page.
                </p>
                <div className={be.authorRow}>
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
                    {addingAuthor ? "Adding…" : "Add author"}
                  </button>
                </div>
              </div>
            </section>

            <section className={be.section} aria-labelledby="edit-section-media">
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <ImageIcon size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Media</p>
                  <h2 id="edit-section-media" className={be.sectionTitle}>
                    Cover image
                  </h2>
                  <p className={be.sectionLead}>
                    Hero image for listings and social cards. Upload replaces the
                    current file.
                  </p>
                </div>
              </div>
              <div className={be.mediaPreview}>
                {formData.image ? (
                  <div className={be.previewFrame}>
                    <Image
                      src={formData.image}
                      alt={coverImageAltForBlog({
                        cover_image_alt: formData.cover_image_alt,
                        title: formData.title,
                      })}
                      width={320}
                      height={320}
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  </div>
                ) : (
                  <div className={be.emptyMedia}>No cover image yet.</div>
                )}
                <div className={admin.formField} style={{ flex: "1 1 220px" }}>
                  <label className={admin.fieldLabel} htmlFor="edit-blog-upload">
                    Upload or replace
                  </label>
                  <input
                    id="edit-blog-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={`${admin.fieldInput} ${be.fileInput}`}
                    disabled={uploading}
                  />
                  {uploading && (
                    <p className={admin.fieldHelp}>Working…</p>
                  )}
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
              <div className={admin.formField}>
                <label className={admin.fieldLabel} htmlFor="edit-blog-cover-alt">
                  Cover image alt text
                </label>
                <input
                  id="edit-blog-cover-alt"
                  name="cover_image_alt"
                  value={formData.cover_image_alt}
                  onChange={handleChange}
                  className={admin.fieldInput}
                  placeholder="Describe the image for SEO (e.g. A developer coding)"
                />
                <p className={admin.fieldHelp}>
                  Used for accessibility and social previews. If empty, the post
                  title is used.
                </p>
              </div>
            </section>

            <section
              className={be.section}
              aria-labelledby="edit-section-summary"
            >
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <AlignLeft size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Summary</p>
                  <h2 id="edit-section-summary" className={be.sectionTitle}>
                    Excerpt &amp; discovery
                  </h2>
                  <p className={be.sectionLead}>
                    Short description, tags, and optional read time.
                  </p>
                </div>
              </div>
              <div className={admin.formField}>
                <label className={admin.fieldLabel} htmlFor="edit-blog-desc">
                  Description
                </label>
                <textarea
                  id="edit-blog-desc"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={admin.fieldTextarea}
                />
              </div>
              <div className={be.grid2}>
                <div className={admin.formField}>
                  <label className={admin.fieldLabel} htmlFor="edit-blog-tags">
                    Tags
                  </label>
                  <input
                    id="edit-blog-tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className={admin.fieldInput}
                    placeholder="Comma-separated (e.g. Next.js, React)"
                  />
                  <p className={admin.fieldHelp}>
                    For related posts and search. Default is &quot;Web Development&quot;
                    if empty.
                  </p>
                </div>
                <div className={admin.formField}>
                  <label className={admin.fieldLabel} htmlFor="edit-blog-read">
                    Read time (minutes)
                  </label>
                  <input
                    id="edit-blog-read"
                    name="readTime"
                    type="number"
                    min="1"
                    value={formData.readTime}
                    onChange={handleChange}
                    className={admin.fieldInput}
                    placeholder="Auto from content if empty"
                  />
                  <p className={admin.fieldHelp}>
                    Optional. If empty, estimated from length (~200 words/min).
                  </p>
                </div>
              </div>
            </section>

            <section className={be.section} aria-labelledby="edit-section-seo">
              <div className={be.seoSection}>
                <div className={be.sectionHead}>
                  <div className={be.sectionIcon} aria-hidden>
                    <Search size={20} strokeWidth={1.75} />
                  </div>
                  <div className={be.sectionHeadText}>
                    <p className={be.sectionKicker}>SEO</p>
                    <h2 id="edit-section-seo" className={be.sectionTitle}>
                      Search &amp; metadata (optional)
                    </h2>
                    <p className={be.sectionLead}>
                      Leave blank to auto-generate titles and descriptions from your
                      content. Supporting keywords feed structured data — not the
                      legacy meta keywords tag.
                    </p>
                  </div>
                </div>
                <div className={be.seoFields}>
                  <div className={admin.formField}>
                    <label
                      className={admin.fieldLabel}
                      htmlFor="edit-blog-focus-kw"
                    >
                      Focus keyword
                    </label>
                    <input
                      id="edit-blog-focus-kw"
                      name="focus_keyword"
                      value={formData.focus_keyword}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Primary phrase for this post"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label
                      className={admin.fieldLabel}
                      htmlFor="edit-blog-seo-kw"
                    >
                      Supporting keywords
                    </label>
                    <input
                      id="edit-blog-seo-kw"
                      name="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Comma-separated (e.g. Next.js, SSR, performance)"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label
                      className={admin.fieldLabel}
                      htmlFor="edit-blog-meta-title"
                    >
                      Meta title override
                    </label>
                    <input
                      id="edit-blog-meta-title"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleChange}
                      className={admin.fieldInput}
                      placeholder="Overrides browser title / OG title when set"
                    />
                  </div>
                  <div className={admin.formField}>
                    <label
                      className={admin.fieldLabel}
                      htmlFor="edit-blog-meta-desc"
                    >
                      Meta description override
                    </label>
                    <textarea
                      id="edit-blog-meta-desc"
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleChange}
                      className={admin.fieldTextarea}
                      rows={3}
                      placeholder="Overrides search snippet when set"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={be.section} aria-labelledby="edit-section-body">
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <PenLine size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Body</p>
                  <h2 id="edit-section-body" className={be.sectionTitle}>
                    Content (HTML)
                  </h2>
                  <p className={be.sectionLead}>
                    Full article body. Inline images upload to the same storage
                    bucket as the cover.
                  </p>
                </div>
              </div>
              <div className={`${admin.formField} ${be.editorBlock}`}>
                {process.env.NEXT_PUBLIC_TINYMCE_API_KEY ? (
                  <div className={be.editorShell}>
                    <Editor
                      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                      value={formData.content}
                      init={{
                        height: 600,
                        menubar:
                          "file edit view insert format tools table help",
                        image_advtab: true,
                        image_title: true,
                        image_description: true,
                        plugins: [
                          "advlist",
                          "lists",
                          "autolink",
                          "link",
                          "image",
                          "charmap",
                          "preview",
                          "anchor",
                          "searchreplace",
                          "visualblocks",
                          "code",
                          "fullscreen",
                          "insertdatetime",
                          "media",
                          "table",
                          "help",
                          "wordcount",
                        ],
                        toolbar:
                          "undo redo | styles | bold italic underline strikethrough | " +
                          "alignleft aligncenter alignright alignjustify | " +
                          "bullist numlist outdent indent | blockquote | code | image | link | removeformat | help",
                        content_style:
                          "body { background: #181818; color: #fff; font-family:Helvetica,Arial,sans-serif; font-size:16px }",
                        setup: (editor) => {
                          editor.on("NodeChange", (e) => {
                            const el = e.element;
                            if (el && el.tagName === "IMG") {
                              const alt = el.getAttribute("alt");
                              if (!alt || alt.trim() === "") {
                                const fallback =
                                  el.getAttribute("title") ||
                                  document.querySelector('[name="title"]')
                                    ?.value ||
                                  "Blog image";
                                el.setAttribute("alt", fallback);
                              }
                            }
                          });
                        },
                        images_upload_handler: (blobInfo) =>
                          new Promise((resolve, reject) => {
                            (async () => {
                              try {
                                const raw = blobInfo.blob();
                                const baseName =
                                  blobInfo.filename() ||
                                  `inline-${Date.now()}.png`;
                                let file = new File([raw], baseName, {
                                  type: raw.type || "image/jpeg",
                                });
                                try {
                                  file = await optimizeImageFile(file);
                                } catch {
                                  /* keep original */
                                }
                                const fileExt =
                                  file.name.split(".").pop() ||
                                  baseName.split(".").pop() ||
                                  "jpg";
                                const fileName = `${Date.now()}.${fileExt}`;
                                const { error } = await supabase.storage
                                  .from("blog-images")
                                  .upload(fileName, file, {
                                    cacheControl: "3600",
                                    upsert: false,
                                    contentType: file.type || "image/jpeg",
                                  });
                                if (error) {
                                  reject("Upload failed: " + error.message);
                                  return;
                                }
                                const { data: publicData } = supabase.storage
                                  .from("blog-images")
                                  .getPublicUrl(fileName);
                                resolve(publicData.publicUrl);
                              } catch (err) {
                                reject(
                                  "Upload failed: " +
                                    (err.message || String(err)),
                                );
                              }
                            })();
                          }),
                      }}
                      onEditorChange={(val) =>
                        setFormData({ ...formData, content: val })
                      }
                    />
                  </div>
                ) : (
                  <div className={admin.editorFallback}>
                    <p>
                      TinyMCE API key not found. Add NEXT_PUBLIC_TINYMCE_API_KEY
                      to your environment.
                    </p>
                    <p>
                      API key:{" "}
                      {process.env.NEXT_PUBLIC_TINYMCE_API_KEY
                        ? "Present"
                        : "Missing"}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <div className={be.stickyActions}>
              <button
                type="submit"
                disabled={saving || uploading}
                className={admin.btnPrimary}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
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
    </div>
  );
}
