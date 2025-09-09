"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { Editor } from "@tinymce/tinymce-react";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "./EditBlog.module.css";

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
  });

  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchUsers();
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

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name, email, role")
      .order("full_name");

    if (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } else {
      setUsers(data);
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

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setErrorMsg(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("blog-images")
      .getPublicUrl(filePath);

    setFormData((prev) => ({ ...prev, image: data.publicUrl }));
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
        setErrorMsg("Error deleting image: " + deleteError.message);
      } else {
        // Clear image from form
        setFormData((prev) => ({ ...prev, image: "" }));
      }
    } catch (error) {
      setErrorMsg("Error deleting image: " + error.message);
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
            existingSlugs.map((b) => b.slug)
          )
        : formData.slug;

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
      })
      .eq("id", id);

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push("/admin/blogs");
    }
    setSaving(false);
  }

  if (loading) return <p>Loading blog data...</p>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Edit Blog</h1>

      {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Title:</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Slug:</label>
          <input
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="URL-friendly version of title"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Category:</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className={styles.input}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Author:</label>
          <select
            name="author_id"
            value={formData.author_id}
            onChange={handleChange}
            className={styles.input}
          >
            <option value="">Select an author</option>
            {users.map((user) => {
              const displayName =
                user.full_name ||
                (user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : null) ||
                user.email ||
                "Unknown User";

              return (
                <option key={user.id} value={user.id}>
                  {displayName}
                  {user.role === "admin" ? " (Admin)" : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Current Image:</label>
          {formData.image ? (
            <div className={styles.imageContainer}>
              <img src={formData.image} alt="Blog image" />
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={uploading}
                className={styles.deleteBtn}
              >
                {uploading ? "Deleting..." : "Delete Image"}
              </button>
            </div>
          ) : (
            <p>No image uploaded yet</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Upload New Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.input}
            disabled={uploading}
          />
          {uploading && <p>Uploading image...</p>}
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
          <label className={styles.label}>Tags:</label>
          <input
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className={styles.input}
            placeholder="Enter tags separated by commas (e.g., Next.js, React, Web Development)"
          />
          <small className={styles.helpText}>
            Separate multiple tags with commas. These will be used for related
            posts and search. If no tags are provided, "Web Development" will be
            used as default.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Read Time (minutes):</label>
          <input
            name="readTime"
            type="number"
            min="1"
            value={formData.readTime}
            onChange={handleChange}
            className={styles.input}
            placeholder="Leave empty for automatic calculation"
          />
          <small className={styles.helpText}>
            Optional: Manually set the read time in minutes. If left empty, it
            will be automatically calculated based on content length (200 words
            per minute).
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Content (HTML):</label>
          {process.env.NEXT_PUBLIC_TINYMCE_API_KEY ? (
            <Editor
              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
              value={formData.content}
              init={{
                height: 400,
                menubar: "file edit view insert format tools table help",
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
                images_upload_handler: function (blobInfo) {
                  return new Promise((resolve, reject) => {
                    const file = blobInfo.blob();
                    const fileExt = file.name.split(".").pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    supabase.storage
                      .from("blog-images")
                      .upload(fileName, file, {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: file.type,
                      })
                      .then(({ error }) => {
                        if (error) {
                          reject("Upload failed: " + error.message);
                          return;
                        }
                        const { data: publicData } = supabase.storage
                          .from("blog-images")
                          .getPublicUrl(fileName);
                        resolve(publicData.publicUrl);
                      })
                      .catch((err) => {
                        reject("Upload failed: " + err.message);
                      });
                  });
                },
              }}
              onEditorChange={(val) =>
                setFormData({ ...formData, content: val })
              }
            />
          ) : (
            <div
              style={{
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "#f5f5f5",
              }}
            >
              <p>
                ⚠️ TinyMCE API Key not found. Please check your environment
                variables.
              </p>
              <p>
                API Key:{" "}
                {process.env.NEXT_PUBLIC_TINYMCE_API_KEY
                  ? "Present"
                  : "Missing"}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className={styles.submitBtn}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Delete Image Confirmation Modal */}
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
