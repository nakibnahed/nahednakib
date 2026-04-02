"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
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

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

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
      <div className={admin.entityForm}>
        <header className={admin.pageHeader}>
          <p className={admin.eyebrow}>Content</p>
          <h1 className={admin.pageTitle}>New blog post</h1>
          <p className={admin.lead}>
            Draft a new article, set taxonomy and SEO, then publish from the
            blog list.
          </p>
        </header>

        <section className={admin.filtersSection} aria-label="Back">
          <Link href="/admin/blogs" className={admin.backNav}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            Back to blogs
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
            onChange={handleTitleChange}
            required
            className={admin.fieldInput}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Slug:</label>
          <input
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className={admin.fieldInput}
            placeholder="URL-friendly version of title"
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Category:</label>
          <select
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
          <label className={admin.fieldLabel}>Author:</label>
          <select
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
          <p className={admin.fieldHelp}>
            Manage authors in Admin → Authors. Main admin can add authors below.
          </p>
          <div className={admin.formRowInline}>
            <input
              type="text"
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
              placeholder="New author name"
              className={admin.fieldInput}
              style={{ maxWidth: 280 }}
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
          <label className={admin.fieldLabel} htmlFor="new-blog-cover-alt">
            Cover Image Alt Text
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
          <label className={admin.fieldLabel}>Tags:</label>
          <input
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className={admin.fieldInput}
            placeholder="Enter tags separated by commas (e.g., Next.js, React, Web Development)"
          />
          <p className={admin.fieldHelp}>
            Separate multiple tags with commas. These will be used for related
            posts and search. If no tags are provided, &quot;Web Development&quot;
            will be used as default.
          </p>
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Read Time (minutes):</label>
          <input
            name="readTime"
            type="number"
            min="1"
            value={formData.readTime}
            onChange={handleChange}
            className={admin.fieldInput}
            placeholder="Leave empty for automatic calculation"
          />
          <p className={admin.fieldHelp}>
            Optional: manually set read time. If left empty, it is calculated from
            content length (200 words per minute).
          </p>
        </div>

        <div className={admin.formField}>
          <h2 className={admin.formSubheading}>SEO (optional)</h2>
          <p className={admin.fieldHelp}>
            Leave blank to auto-generate titles and descriptions. Supporting
            keywords are used for structured data, not the deprecated meta
            keywords tag.
          </p>
          <label className={admin.fieldLabel}>Focus keyword</label>
          <input
            name="focus_keyword"
            value={formData.focus_keyword}
            onChange={handleChange}
            className={admin.fieldInput}
            placeholder="Primary phrase for this post"
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

        <div className={admin.formField}>
          <span className={admin.fieldLabel}>Content (HTML)</span>
          {process.env.NEXT_PUBLIC_TINYMCE_API_KEY ? (
            <Editor
              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
              value={formData.content}
              init={{
                height: 400,
                menubar: "file edit view insert format tools table help",
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
                          document.querySelector('[name="title"]')?.value ||
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
                          blobInfo.filename() || `inline-${Date.now()}.png`;
                        let file = new File([raw], baseName, {
                          type: raw.type || "image/jpeg",
                        });
                        try {
                          file = await optimizeImageFile(file);
                        } catch {
                          /* keep original */
                        }
                        const fileExt =
                          file.name.split(".").pop() || baseName.split(".").pop() || "jpg";
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
                        reject("Upload failed: " + (err.message || String(err)));
                      }
                    })();
                  }),
              }}
              onEditorChange={(val) =>
                setFormData({ ...formData, content: val })
              }
            />
          ) : (
            <div className={admin.editorFallback}>
              <p>
                TinyMCE API key not found. Add NEXT_PUBLIC_TINYMCE_API_KEY to
                your environment.
              </p>
              <p>
                API key:{" "}
                {process.env.NEXT_PUBLIC_TINYMCE_API_KEY ? "Present" : "Missing"}
              </p>
            </div>
          )}
        </div>

        <div className={admin.formActions}>
          <button type="submit" disabled={loading} className={admin.btnPrimary}>
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
    </div>
  );
}
