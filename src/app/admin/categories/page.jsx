"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { slugify } from "@/lib/utils/slugify";
import styles from "./Categories.module.css";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#ee681a",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
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
    setLoading(false);
  }

  function handleNameChange(e) {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: slugify(name),
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (editingCategory) {
      updateCategory();
    } else {
      createCategory();
    }
  }

  async function createCategory() {
    setLoading(true);
    const { error } = await supabase.from("categories").insert([formData]);

    if (error) {
      alert("Error creating category: " + error.message);
    } else {
      setFormData({ name: "", slug: "", description: "", color: "#ee681a" });
      setShowForm(false);
      fetchCategories();
    }
    setLoading(false);
  }

  async function updateCategory() {
    setLoading(true);
    const { error } = await supabase
      .from("categories")
      .update(formData)
      .eq("id", editingCategory.id);

    if (error) {
      alert("Error updating category: " + error.message);
    } else {
      setFormData({ name: "", slug: "", description: "", color: "#ee681a" });
      setEditingCategory(null);
      setShowForm(false);
      fetchCategories();
    }
    setLoading(false);
  }

  async function deleteCategory(id) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    setLoading(true);
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      alert("Error deleting category: " + error.message);
    } else {
      fetchCategories();
    }
    setLoading(false);
  }

  function editCategory(category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      color: category.color,
    });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "", color: "#ee681a" });
    setShowForm(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Categories</h1>
        <button
          onClick={() => setShowForm(true)}
          className={styles.addButton}
          disabled={loading}
        >
          Add Category
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <h2>{editingCategory ? "Edit Category" : "Add Category"}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Slug:</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={styles.textarea}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Color:</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className={styles.colorInput}
              />
            </div>
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {editingCategory ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <div className={styles.categoriesGrid}>
          {categories.map((category) => (
            <div key={category.id} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <div
                  className={styles.colorIndicator}
                  style={{ backgroundColor: category.color }}
                />
                <h3>{category.name}</h3>
              </div>
              <p className={styles.slug}>/{category.slug}</p>
              {category.description && (
                <p className={styles.description}>{category.description}</p>
              )}
              <div className={styles.actions}>
                <button
                  onClick={() => editCategory(category)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
