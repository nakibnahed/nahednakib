import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/server";
import BlogGrid from "./BlogGrid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Blog() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  let blogQuery = supabase
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
    .eq("publish_status", "published");

  if (!isLoggedIn) {
    blogQuery = blogQuery.eq("visibility", "public");
  }

  const [{ data: categoriesData }, { data: blogsData }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    blogQuery.order("created_at", { ascending: false }),
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
