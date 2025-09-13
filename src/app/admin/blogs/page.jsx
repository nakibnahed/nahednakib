"use client";

import styles from "./BlogsList.module.css";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { Edit, Trash2 } from "lucide-react";

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    setLoading(true);

    // Fetch blogs
    const { data: blogsData, error: blogsError } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (blogsError) {
      console.error("Error fetching blogs:", blogsError);
      setBlogs([]);
      setLoading(false);
      return;
    }

    // Fetch categories map (id -> name)
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name");

    const categoryIdToName = new Map();
    if (!categoriesError && categoriesData) {
      categoriesData.forEach((c) => categoryIdToName.set(c.id, c.name));
    }

    // Attach readable category name
    const decorated = (blogsData || []).map((b) => ({
      ...b,
      categoryName:
        (b.category_id && categoryIdToName.get(b.category_id)) ||
        "Uncategorized",
    }));

    setBlogs(decorated);
    setLoading(false);
  }

  function confirmDelete(blog) {
    setBlogToDelete(blog);
    setShowDeleteConfirm(true);
  }

  async function handleDelete() {
    if (!blogToDelete) return;

    setLoading(true);
    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", blogToDelete.id);

    if (error) {
      alert("Error deleting blog: " + error.message);
    } else {
      setBlogs((prev) => prev.filter((b) => b.id !== blogToDelete.id));
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setBlogToDelete(null);
  }

  const filteredBlogs = useMemo(() => {
    if (!searchTerm) return blogs;
    const lowerTerm = searchTerm.toLowerCase();
    return blogs.filter(
      (b) =>
        (b.title && b.title.toLowerCase().includes(lowerTerm)) ||
        (b.categoryName && b.categoryName.toLowerCase().includes(lowerTerm)) ||
        (b.date && b.date.toLowerCase().includes(lowerTerm))
    );
  }, [blogs, searchTerm]);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.controlsRow}>
        <Link href="/admin/blogs/new" className={styles.newButton}>
          Create New Blog
        </Link>

        <input
          type="text"
          placeholder="Search by title, category or date..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredBlogs.length === 0 ? (
        <p>No blogs found.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Category</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.map((blog) => (
                <tr key={blog.id}>
                  <td data-label="Title">
                    <h4>{blog.title}</h4>
                  </td>
                  <td data-label="Date">{blog.date}</td>
                  <td data-label="Category">{blog.categoryName}</td>
                  <td data-label="Image">
                    {blog.image ? (
                      <Image
                        src={blog.image}
                        alt={blog.title}
                        width={100}
                        height={60}
                        style={{
                          maxWidth: "100px",
                          maxHeight: "60px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      "No image"
                    )}
                  </td>
                  <td data-label="Actions">
                    <div className={styles.actions}>
                      <Link href={`/admin/blogs/${blog.id}/edit`}>
                        <button
                          className={styles.actionButton}
                          title="Edit blog"
                        >
                          <Edit size={16} />
                        </button>
                      </Link>
                      <button
                        className={styles.deleteButton}
                        onClick={() => confirmDelete(blog)}
                        type="button"
                        title="Delete blog"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Blog"
        message="Are you sure you want to delete this blog? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
