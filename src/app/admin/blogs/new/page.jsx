"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { Editor } from "@tinymce/tinymce-react";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";
import styles from "./NewBlog.module.css";

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
  });

  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchUsers();
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
            existingSlugs.map((b) => b.slug)
          )
        : formData.slug;

    let imageUrl = "";

    if (formData.imageFile) {
      const fileExt = formData.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, formData.imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: formData.imageFile.type,
        });

      if (uploadError) {
        setErrorMsg("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      imageUrl = publicData.publicUrl;
    }

    const createdDate = new Date().toLocaleString();

    const { error } = await supabase.from("blogs").insert([
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
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
    } else {
      // Send notification to all users about new blog post
      try {
        await fetch("/api/admin/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "New Blog Post Published! 📝",
            message: `Check out our latest blog post: "${formData.title}"`,
            type: "blog",
            isGlobal: true,
          }),
        });
      } catch (error) {
        console.error("Error sending blog notification:", error);
      }
      router.push("/admin/blogs");
    }
    setLoading(false);
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Create New Blog</h1>

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
          <label className={styles.label}>Image Upload:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.input}
          />
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

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "Saving..." : "Create"}
        </button>
      </form>
    </div>
  );
}
