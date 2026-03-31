import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("authors")
    .select("name, bio")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return { title: "Author" };
  }

  return {
    title: `${data.name} | Blog`,
    description:
      data.bio?.trim() ||
      `Articles by ${data.name} on the blog.`,
    openGraph: {
      title: data.name,
      description: data.bio?.trim() || `Articles by ${data.name}`,
      type: "profile",
    },
  };
}

export default function AuthorLayout({ children }) {
  return children;
}
