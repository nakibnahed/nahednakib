import styles from "./page.module.css";
import { supabase } from "@/services/supabaseClient";
import BlogGrid from "./BlogGrid";

export default async function Blog() {
  const [{ data: categoriesData }, { data: blogsData }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("blogs")
      .select(
        `*,
        categories (
          id,
          name,
          slug,
          color
        )`
      )
      .order("created_at", { ascending: false }),
  ]);

  const categories = categoriesData || [];
  const blogs = blogsData || [];

  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Blog</h1>
        <BlogGrid blogs={blogs} categories={categories} />
      </div>
    </div>
  );
}
