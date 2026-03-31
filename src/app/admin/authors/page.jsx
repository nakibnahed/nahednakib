"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Trash2, Users, Pencil, UserPlus } from "lucide-react";
import { DEFAULT_UNKNOWN_AUTHOR_ID } from "@/constants/defaultAuthor";
import { showAppToast } from "@/lib/showAppToast";
import styles from "./Authors.module.css";

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteStrategy, setDeleteStrategy] = useState("nullify");
  const [reassignTo, setReassignTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/authors");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load authors");
        setAuthors([]);
        return;
      }
      setAuthors(json.authors || []);
    } catch (e) {
      setError(e.message || "Failed to load");
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalArticles = authors.reduce(
      (sum, a) => sum + (a.article_count || 0),
      0,
    );
    return {
      totalAuthors: authors.length,
      totalArticles,
    };
  }, [authors]);

  async function confirmDelete() {
    if (!deleteId) return;
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("strategy", deleteStrategy);
      if (deleteStrategy === "reassign" && reassignTo.trim()) {
        params.set("reassignTo", reassignTo.trim());
      }
      const res = await fetch(`/api/authors/${deleteId}?${params.toString()}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || "Delete failed";
        setError(msg);
        showAppToast(msg, "error");
        return;
      }
      setDeleteId(null);
      setReassignTo("");
      showAppToast("Author deleted.", "success");
      await load();
    } catch (err) {
      const msg = err.message || "Delete failed";
      setError(msg);
      showAppToast(msg, "error");
    }
  }

  if (loading && authors.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading authors…</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Users size={28} strokeWidth={2} />
          Authors
        </h1>
        <p className={styles.subtitle}>
          Content authors are separate from user accounts. Only the main admin can
          create, edit, or delete authors. Deleting an author does not delete blog
          posts — articles are unlinked or reassigned.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total authors</h3>
          <p>{stats.totalAuthors}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Blog posts linked</h3>
          <p>{stats.totalArticles}</p>
        </div>
      </div>

      <div className={styles.controlsRow}>
        <Link href="/admin/authors/new" className={styles.newButton}>
          <UserPlus size={18} />
          Add author
        </Link>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.recentSection}>
        <h2>All authors</h2>
        <div className={styles.authorsList}>
          {authors.length === 0 ? (
            <p className={styles.emptyMessage}>No authors yet.</p>
          ) : (
            authors.map((a) => (
              <div key={a.id} className={styles.authorItem}>
                <div className={styles.authorRow}>
                  <div className={styles.authorThumb}>
                    {a.avatar_url?.trim() ? (
                      <Image
                        src={a.avatar_url.trim()}
                        alt=""
                        width={44}
                        height={44}
                        className={styles.avatarThumbImg}
                      />
                    ) : (
                      <div className={styles.authorThumbPlaceholder}>
                        <User size={22} strokeWidth={1.75} />
                      </div>
                    )}
                  </div>
                  <div className={styles.authorInfo}>
                    <h4>
                      {a.name}
                      {a.id === DEFAULT_UNKNOWN_AUTHOR_ID && (
                        <span
                          className={styles.systemBadge}
                          title="Created by DB migration; cannot edit or delete"
                        >
                          System
                        </span>
                      )}
                    </h4>
                    {(a.role || a.bio) && (
                      <p className={styles.authorLine}>
                        {a.role ||
                          (a.bio &&
                          a.bio.length > 120
                            ? `${a.bio.slice(0, 120)}…`
                            : a.bio || "")}
                      </p>
                    )}
                  </div>
                </div>
                <div className={styles.authorMeta}>
                  <span className={styles.articleBadge}>
                    {a.article_count ?? 0}{" "}
                    {(a.article_count ?? 0) === 1 ? "post" : "posts"}
                  </span>
                  <div className={styles.authorActions}>
                    {a.id === DEFAULT_UNKNOWN_AUTHOR_ID ? (
                      <span
                        className={styles.editDisabledHint}
                        title="Placeholder author — cannot be edited"
                      >
                        <Pencil size={15} />
                        Edit
                      </span>
                    ) : (
                      <Link
                        href={`/admin/authors/${a.id}/edit`}
                        className={styles.secondaryButton}
                      >
                        <Pencil size={15} />
                        Edit
                      </Link>
                    )}
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => setDeleteId(a.id)}
                      disabled={a.id === DEFAULT_UNKNOWN_AUTHOR_ID}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deleteId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Delete author</h2>
            <p>
              Choose what happens to blog posts and portfolios that reference this
              author.
            </p>
            <div className={styles.deleteSection}>
              <h3>Content</h3>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="delstrat"
                  checked={deleteStrategy === "nullify"}
                  onChange={() => setDeleteStrategy("nullify")}
                  className={styles.radio}
                />
                Unlink (clear author on articles)
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="delstrat"
                  checked={deleteStrategy === "reassign"}
                  onChange={() => setDeleteStrategy("reassign")}
                  className={styles.radio}
                />
                Reassign to another author
              </label>
            </div>
            {deleteStrategy === "reassign" && (
              <div className={styles.formGroup}>
                <label htmlFor="reassign-select">Reassign to</label>
                <select
                  id="reassign-select"
                  className={styles.select}
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                >
                  <option value="">Unknown (default)</option>
                  {authors
                    .filter((x) => x.id !== deleteId)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalDanger}
                onClick={confirmDelete}
              >
                <Trash2 size={16} />
                Delete author
              </button>
              <button
                type="button"
                className={styles.modalGhost}
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
