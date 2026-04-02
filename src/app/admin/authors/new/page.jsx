"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, X, User, Trash2, UserPlus, ArrowLeft } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { avatarsBucketPathFromPublicUrl } from "@/lib/storage/avatarPublicUrl";
import { showAppToast } from "@/lib/showAppToast";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "../Authors.module.css";

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

export default function NewAuthorPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    bio: "",
    avatar_url: "",
  });
  const [createAvatarFile, setCreateAvatarFile] = useState(null);
  const [createPreviewUrl, setCreatePreviewUrl] = useState("");

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

  function handleCreateAvatarPick(e) {
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
    setCreateAvatarFile(file);
    setCreatePreviewUrl(URL.createObjectURL(file));
  }

  function removeCreateAvatarPick() {
    if (createPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(createPreviewUrl);
    }
    setCreateAvatarFile(null);
    setCreatePreviewUrl(form.avatar_url.trim() || "");
  }

  async function clearCreateAvatar() {
    if (createPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(createPreviewUrl);
    }
    const prevUrl = form.avatar_url.trim();
    if (prevUrl) {
      await removeStoredAvatarForUrl(prevUrl);
    }
    setCreateAvatarFile(null);
    setForm((f) => ({ ...f, avatar_url: "" }));
    setCreatePreviewUrl("");
  }

  async function handleCreate(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      let avatarUrl = form.avatar_url.trim() || null;
      if (createAvatarFile) {
        setUploading(true);
        avatarUrl = await uploadAuthorAvatar(
          createAvatarFile,
          `authors/${crypto.randomUUID()}`,
        );
        setUploading(false);
      }

      const res = await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role: form.role.trim() || null,
          bio: form.bio.trim() || null,
          avatar_url: avatarUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || "Create failed";
        setError(msg);
        showAppToast(msg, "error");
        return;
      }
      if (createPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(createPreviewUrl);
      }
      showAppToast("Author created successfully.", "success");
      router.push("/admin/authors");
    } catch (err) {
      const msg = err.message || "Create failed";
      setError(msg);
      showAppToast(msg, "error");
    } finally {
      setCreating(false);
      setUploading(false);
    }
  }

  return (
    <div className={admin.page}>
      <div className={admin.entityForm}>
        <header className={admin.pageHeader}>
          <p className={admin.eyebrow}>Content</p>
          <div className={styles.entityTitleRow}>
            <UserPlus size={26} strokeWidth={2} aria-hidden />
            <h1 className={admin.pageTitle}>New author</h1>
          </div>
          <p className={admin.lead}>
            Add a content author for blog posts and portfolios. Separate from site
            user accounts.
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
        <form onSubmit={handleCreate} className={`${styles.form} ${admin.formStack}`}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="new-author-name">Name *</label>
              <input
                id="new-author-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={styles.input}
                placeholder="Display name"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="new-author-role">Role</label>
              <input
                id="new-author-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={styles.input}
                placeholder="Short byline on blog posts"
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="new-author-bio">Bio</label>
            <textarea
              id="new-author-bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className={styles.textarea}
              rows={4}
              placeholder="Full bio on the author page"
            />
          </div>

          <div className={styles.avatarPanel}>
            <h3 className={styles.avatarPanelTitle}>Photo</h3>
            <div className={styles.avatarSection}>
              <div className={styles.avatarPreview}>
                {createPreviewUrl ? (
                  <Image
                    src={createPreviewUrl}
                    alt=""
                    width={88}
                    height={88}
                    className={styles.avatarImage}
                    unoptimized={
                      createPreviewUrl.startsWith("blob:") ||
                      createPreviewUrl.startsWith("data:")
                    }
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <User size={36} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className={styles.avatarControls}>
                <label htmlFor="new-author-avatar" className={styles.uploadButton}>
                  <Upload size={16} />
                  {createAvatarFile ? "Change image" : "Upload image"}
                </label>
                <input
                  id="new-author-avatar"
                  type="file"
                  accept="image/*"
                  className={styles.hiddenFile}
                  onChange={handleCreateAvatarPick}
                />
                {createAvatarFile && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={removeCreateAvatarPick}
                  >
                    <X size={16} />
                    Discard new image
                  </button>
                )}
                {(form.avatar_url.trim() || createPreviewUrl) &&
                  !createAvatarFile && (
                    <button
                      type="button"
                      className={styles.deletePhotoButton}
                      onClick={clearCreateAvatar}
                      disabled={uploading}
                    >
                      <Trash2 size={16} />
                      Remove photo
                    </button>
                  )}
                {createAvatarFile && (
                  <p className={styles.fileInfo}>{createAvatarFile.name}</p>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="new-author-url">Or paste image URL</label>
              <input
                id="new-author-url"
                value={form.avatar_url}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, avatar_url: v });
                  if (!createAvatarFile) setCreatePreviewUrl(v.trim());
                }}
                className={styles.input}
                placeholder="https://…"
              />
            </div>
            <p className={styles.fieldHint}>
              Same storage as profile avatars (max 5MB for uploads).
            </p>
          </div>

          <div className={`${styles.newPageActions} ${admin.formActions}`}>
            <button
              type="submit"
              disabled={creating || uploading}
              className={admin.btnPrimary}
            >
              {uploading ? "Uploading…" : creating ? "Saving…" : "Create author"}
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
