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
  PenLine,
  Search,
} from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import be from "../BlogEditor.module.css";
import { supabase } from "@/services/supabaseClient";
import { Editor } from "@tinymce/tinymce-react";
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
  });

  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [addingAuthor, setAddingAuthor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

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

    // Generate unique slug
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
        uploadFile = await optimizeImageFile(formData.imageFile);
      } catch {
        uploadFile = formData.imageFile;
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
        const msg = "Image upload failed: " + uploadError.message;
        setErrorMsg(msg);
        showAppToast(msg, "error");
        setLoading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      imageUrl = publicData.publicUrl;
    }

    const createdDate = new Date().toLocaleString();

    const { data: createdBlog, error } = await supabase
      .from("blogs")
      .insert([
        {
          title: formData.title,
          slug: uniqueSlug,
          image: imageUrl,
          date: createdDate,
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
        },
      ])
      .select("id")
      .single();

    if (error) {
      setErrorMsg(error.message);
      showAppToast(error.message || "Could not create blog post.", "error");
    } else {
      showAppToast("Blog post created successfully.", "success");
      // Send notification to all users about new blog post
      try {
        const response = await fetch("/api/admin/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
      router.push("/admin/blogs");
    }
    setLoading(false);
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
            <span className={be.metaChip}>New draft</span>
          </div>
          <h1 className={admin.pageTitle}>New blog post</h1>
          <p className={admin.lead}>
            Draft a new article, set taxonomy and SEO, then manage it from the
            blog list.
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
            <section className={be.section} aria-labelledby="new-section-basics">
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <FileText size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Basics</p>
                  <h2 id="new-section-basics" className={be.sectionTitle}>
                    Title &amp; URL
                  </h2>
                  <p className={be.sectionLead}>
                    The headline and slug used on the site and in share links.
                  </p>
                </div>
              </div>
              <div className={be.grid2}>
                <div className={admin.formField}>
                  <label className={admin.fieldLabel} htmlFor="new-blog-title">
                    Title
                  </label>
                  <input
                    id="new-blog-title"
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                    className={admin.fieldInput}
                  />
                </div>
                <div className={admin.formField}>
                  <label className={admin.fieldLabel} htmlFor="new-blog-slug">
                    Slug
                  </label>
                  <input
                    id="new-blog-slug"
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
              aria-labelledby="new-section-taxonomy"
            >
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <Layers size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Classification</p>
                  <h2 id="new-section-taxonomy" className={be.sectionTitle}>
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
                    htmlFor="new-blog-category"
                  >
                    Category
                  </label>
                  <select
                    id="new-blog-category"
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
                  <label className={admin.fieldLabel} htmlFor="new-blog-author">
                    Author
                  </label>
                  <select
                    id="new-blog-author"
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

            <section className={be.section} aria-labelledby="new-section-media">
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <ImageIcon size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Media</p>
                  <h2 id="new-section-media" className={be.sectionTitle}>
                    Cover image
                  </h2>
                  <p className={be.sectionLead}>
                    Optional hero image for listings and social cards. You can
                    add one now or later when editing.
                  </p>
                </div>
              </div>
              <div className={be.mediaPreview}>
                {coverPreviewUrl ? (
                  <div className={be.previewFrame}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPreviewUrl}
                      alt={coverImageAltForBlog({
                        cover_image_alt: formData.cover_image_alt,
                        title: formData.title,
                      })}
                      style={{ maxWidth: "100%", height: "auto", display: "block" }}
                    />
                  </div>
                ) : (
                  <div className={be.emptyMedia}>No file selected yet.</div>
                )}
                <div className={admin.formField} style={{ flex: "1 1 220px" }}>
                  <label className={admin.fieldLabel} htmlFor="new-blog-upload">
                    Upload image
                  </label>
                  <input
                    id="new-blog-upload"
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
              <div className={admin.formField}>
                <label className={admin.fieldLabel} htmlFor="new-blog-cover-alt">
                  Cover image alt text
                </label>
                <input
                  id="new-blog-cover-alt"
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
              aria-labelledby="new-section-summary"
            >
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <AlignLeft size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Summary</p>
                  <h2 id="new-section-summary" className={be.sectionTitle}>
                    Excerpt &amp; discovery
                  </h2>
                  <p className={be.sectionLead}>
                    Short description, tags, and optional read time.
                  </p>
                </div>
              </div>
              <div className={admin.formField}>
                <label className={admin.fieldLabel} htmlFor="new-blog-desc">
                  Description
                </label>
                <textarea
                  id="new-blog-desc"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={admin.fieldTextarea}
                />
              </div>
              <div className={be.grid2}>
                <div className={admin.formField}>
                  <label className={admin.fieldLabel} htmlFor="new-blog-tags">
                    Tags
                  </label>
                  <input
                    id="new-blog-tags"
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
                  <label className={admin.fieldLabel} htmlFor="new-blog-read">
                    Read time (minutes)
                  </label>
                  <input
                    id="new-blog-read"
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

            <section className={be.section} aria-labelledby="new-section-seo">
              <div className={be.seoSection}>
                <div className={be.sectionHead}>
                  <div className={be.sectionIcon} aria-hidden>
                    <Search size={20} strokeWidth={1.75} />
                  </div>
                  <div className={be.sectionHeadText}>
                    <p className={be.sectionKicker}>SEO</p>
                    <h2 id="new-section-seo" className={be.sectionTitle}>
                      Search &amp; metadata (optional)
                    </h2>
                    <p className={be.sectionLead}>
                      Leave blank to auto-generate titles and descriptions.
                      Supporting keywords feed structured data, not the deprecated
                      meta keywords tag.
                    </p>
                  </div>
                </div>
                <div className={be.seoFields}>
                  <div className={admin.formField}>
                    <label
                      className={admin.fieldLabel}
                      htmlFor="new-blog-focus-kw"
                    >
                      Focus keyword
                    </label>
                    <input
                      id="new-blog-focus-kw"
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
                      htmlFor="new-blog-seo-kw"
                    >
                      Supporting keywords
                    </label>
                    <input
                      id="new-blog-seo-kw"
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
                      htmlFor="new-blog-meta-title"
                    >
                      Meta title override
                    </label>
                    <input
                      id="new-blog-meta-title"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleChange}
                      className={admin.fieldInput}
                    />
                  </div>
                  <div className={admin.formField}>
                    <label
                      className={admin.fieldLabel}
                      htmlFor="new-blog-meta-desc"
                    >
                      Meta description override
                    </label>
                    <textarea
                      id="new-blog-meta-desc"
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

            <section className={be.section} aria-labelledby="new-section-body">
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <PenLine size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>Body</p>
                  <h2 id="new-section-body" className={be.sectionTitle}>
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
                disabled={loading}
                className={admin.btnPrimary}
              >
                {loading ? "Saving…" : "Create post"}
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
  );
}
