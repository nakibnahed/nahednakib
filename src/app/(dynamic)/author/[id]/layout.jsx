import { createClient } from "@/lib/supabase/server";
import { getDefaultOgImageUrl } from "@/lib/seo/site";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("authors")
    .select("name, bio, avatar_url")
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
      images: [{ url: data.avatar_url || getDefaultOgImageUrl(), width: 1200, height: 630 }],
    },
  };
}

export default function AuthorLayout({ children }) {
  return children;
}
