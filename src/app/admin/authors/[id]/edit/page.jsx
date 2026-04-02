"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Upload, X, User, Trash2, Pencil, ArrowLeft } from "lucide-react";
import { DEFAULT_UNKNOWN_AUTHOR_ID } from "@/constants/defaultAuthor";
import { supabase } from "@/services/supabaseClient";
import { avatarsBucketPathFromPublicUrl } from "@/lib/storage/avatarPublicUrl";
import { showAppToast } from "@/lib/showAppToast";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "../../Authors.module.css";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function validateImageFile(file) {
  if (!file.type.startsWith("image/")) {
    return "Please select an image file";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "Image must be under 5MB";
  }
  return null;
}

export default function EditAuthorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? String(params.id) : "";

  const [loading, setLoading] = useState(true);
  const [authorLoaded, setAuthorLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState("");
  const [form, setForm] = useState({
    name: "",
    role: "",
    bio: "",
    avatar_url: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const loadAuthor = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Missing author id");
      return;
    }
    if (id === DEFAULT_UNKNOWN_AUTHOR_ID) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setAuthorLoaded(false);
    try {
      const res = await fetch(`/api/authors/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load author");
        return;
      }
      const a = json.author;
      if (!a) {
        setError("Author not found");
        return;
      }
      setForm({
        name: a.name || "",
        role: a.role || "",
        bio: a.bio || "",
        avatar_url: a.avatar_url || "",
      });
      const av = a.avatar_url?.trim() || "";
      setInitialAvatarUrl(av);
      setPreviewUrl(av);
      setAuthorLoaded(true);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAuthor();
  }, [loadAuthor]);

  async function uploadAuthorAvatar(file, pathPrefix) {
    const ext =
      file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    const path = `${pathPrefix}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file);

    if (uploadError) {
      console.error("Author avatar upload:", uploadError);
      throw new Error(uploadError.message || "Upload failed");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    return publicUrl;
  }

  async function removeStoredAvatarForUrl(url) {
    const path = avatarsBucketPathFromPublicUrl(url);
    if (!path) return;
    const { error } = await supabase.storage.from("avatars").remove([path]);
    if (error) {
      console.warn("Storage remove:", error.message);
    }
  }

  function handleAvatarPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const msg = validateImageFile(file);
    if (msg) {
      setError(msg);
      showAppToast(msg, "error");
      return;
    }
    setError("");
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeAvatarPick() {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setAvatarFile(null);
    setPreviewUrl(form.avatar_url.trim() || "");
  }

  async function clearAvatar() {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    const prevUrl = form.avatar_url.trim();
    if (prevUrl) {
      await removeStoredAvatarForUrl(prevUrl);
    }
    setAvatarFile(null);
    setForm((f) => ({ ...f, avatar_url: "" }));
    setPreviewUrl("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!id || id === DEFAULT_UNKNOWN_AUTHOR_ID) return;

    setSaving(true);
    setError(null);
    try {
      let avatarUrl = form.avatar_url.trim() || null;
      if (avatarFile) {
        setUploading(true);
        avatarUrl = await uploadAuthorAvatar(avatarFile, `authors/${id}`);
        setUploading(false);
      }

      const res = await fetch(`/api/authors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim() || null,
          bio: form.bio.trim() || null,
          avatar_url: avatarUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || "Update failed";
        setError(msg);
        showAppToast(msg, "error");
        return;
      }

      const finalUrl = (avatarUrl || "").trim();
      if (initialAvatarUrl && initialAvatarUrl !== finalUrl) {
        await removeStoredAvatarForUrl(initialAvatarUrl);
      }

      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      showAppToast("Author updated successfully.", "success");
      router.push("/admin/authors");
    } catch (err) {
      const msg = err.message || "Update failed";
      setError(msg);
      showAppToast(msg, "error");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  if (id === DEFAULT_UNKNOWN_AUTHOR_ID) {
    return (
      <div className={admin.page}>
        <div className={admin.entityForm}>
          <section className={admin.filtersSection}>
            <Link href="/admin/authors" className={admin.backNav}>
              <ArrowLeft size={18} />
              Back to authors
            </Link>
          </section>
          <div className={admin.formErrorBanner}>
            The system &quot;Unknown&quot; author cannot be edited. It is used for
            unassigned content.
          </div>
          <Link href="/admin/authors" className={styles.newButton}>
            Return to authors
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={admin.page}>
        <div className={admin.loadingPanel}>
          <div className={admin.loadingSpinner} aria-hidden />
          <span>Loading author…</span>
        </div>
      </div>
    );
  }

  if (!loading && !authorLoaded && error) {
    return (
      <div className={admin.page}>
        <div className={admin.entityForm}>
          <section className={admin.filtersSection}>
            <Link href="/admin/authors" className={admin.backNav}>
              <ArrowLeft size={18} />
              Back to authors
            </Link>
          </section>
          <div className={admin.formErrorBanner}>{error}</div>
          <button
            type="button"
            className={admin.btnPrimary}
            onClick={loadAuthor}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={admin.page}>
      <div className={admin.entityForm}>
        <header className={admin.pageHeader}>
          <p className={admin.eyebrow}>Content</p>
          <div className={styles.entityTitleRow}>
            <Pencil size={26} strokeWidth={2} aria-hidden />
            <h1 className={admin.pageTitle}>Edit author</h1>
          </div>
          <p className={admin.lead}>
            Update name, role, bio, and photo. Changes apply on blog posts and the
            public author page.
          </p>
        </header>

        <section className={admin.filtersSection} aria-label="Back">
          <Link href="/admin/authors" className={admin.backNav}>
            <ArrowLeft size={18} />
            Back to authors
          </Link>
        </section>

        {error && <div className={admin.formErrorBanner}>{error}</div>}

        <div className={admin.formCard}>
        <form onSubmit={handleSubmit} className={`${styles.form} ${admin.formStack}`}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="edit-author-name">Name *</label>
              <input
                id="edit-author-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="edit-author-role">Role</label>
              <input
                id="edit-author-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={styles.input}
                placeholder="Short byline on blog posts"
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="edit-author-bio">Bio</label>
            <textarea
              id="edit-author-bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className={styles.textarea}
              rows={4}
            />
          </div>

          <div className={styles.avatarPanel}>
            <h3 className={styles.avatarPanelTitle}>Photo</h3>
            <div className={styles.avatarSection}>
              <div className={styles.avatarPreview}>
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt=""
                    width={88}
                    height={88}
                    className={styles.avatarImage}
                    unoptimized={
                      previewUrl.startsWith("blob:") ||
                      previewUrl.startsWith("data:")
                    }
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <User size={36} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className={styles.avatarControls}>
                <label htmlFor="edit-author-avatar" className={styles.uploadButton}>
                  <Upload size={16} />
                  {avatarFile ? "Change image" : "Upload image"}
                </label>
                <input
                  id="edit-author-avatar"
                  type="file"
                  accept="image/*"
                  className={styles.hiddenFile}
                  onChange={handleAvatarPick}
                />
                {avatarFile && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={removeAvatarPick}
                  >
                    <X size={16} />
                    Discard new image
                  </button>
                )}
                {(form.avatar_url.trim() || previewUrl) && !avatarFile && (
                  <button
                    type="button"
                    className={styles.deletePhotoButton}
                    onClick={clearAvatar}
                    disabled={uploading}
                  >
                    <Trash2 size={16} />
                    Remove photo
                  </button>
                )}
                {avatarFile && (
                  <p className={styles.fileInfo}>{avatarFile.name}</p>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="edit-author-url">Or paste image URL</label>
              <input
                id="edit-author-url"
                value={form.avatar_url}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, avatar_url: v });
                  if (!avatarFile) setPreviewUrl(v.trim());
                }}
                className={styles.input}
                placeholder="https://…"
              />
            </div>
          </div>

          <div className={`${styles.newPageActions} ${admin.formActions}`}>
            <button
              type="submit"
              className={admin.btnPrimary}
              disabled={saving || uploading}
            >
              {uploading ? "Uploading…" : saving ? "Saving…" : "Save changes"}
            </button>
            <Link href="/admin/authors" className={styles.modalGhost}>
              Cancel
            </Link>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
