import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, slug, published = false } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Create blog post (assuming you have a blogs table)
    const { data: blog, error } = await supabase
      .from("blogs")
      .insert([
        {
          title,
          content,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
          published,
          author_id: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating blog post:", error);
      return NextResponse.json(
        { error: "Failed to create blog post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error("Error in blog API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get published blog posts
    const { data: blogs, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blogs:", error);
      return NextResponse.json(
        { error: "Failed to fetch blogs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error("Error in blog API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, title, content, slug, published } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    // Get current blog post to check if it was unpublished before
    const { data: currentBlog } = await supabase
      .from("blogs")
      .select("published")
      .eq("id", id)
      .single();

    const wasUnpublished = currentBlog && !currentBlog.published;

    // Update blog post
    const { data: blog, error } = await supabase
      .from("blogs")
      .update({
        title,
        content,
        slug,
        published,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating blog post:", error);
      return NextResponse.json(
        { error: "Failed to update blog post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error("Error in blog API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
