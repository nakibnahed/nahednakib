import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function requireAdmin(supabase) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      ),
    };
  }

  return { user };
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (admin.error) return admin.error;

    const body = await request.json();
    const { title, content, slug, published = false, author_id } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 },
      );
    }

    const insertRow = {
      title,
      content,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
      published,
    };

    if (author_id !== undefined && author_id !== null && author_id !== "") {
      insertRow.author_id = author_id;
    }

    const { data: blog, error } = await supabase
      .from("blogs")
      .insert([insertRow])
      .select()
      .single();

    if (error) {
      console.error("Error creating blog post:", error);
      return NextResponse.json(
        { error: "Failed to create blog post" },
        { status: 500 },
      );
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error("Error in blog API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: blogs, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blogs:", error);
      return NextResponse.json(
        { error: "Failed to fetch blogs" },
        { status: 500 },
      );
    }

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error("Error in blog API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (admin.error) return admin.error;

    const body = await request.json();
    const { id, title, content, slug, published, author_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 },
      );
    }

    const updatePayload = {
      title,
      content,
      slug,
      published,
    };

    if (author_id !== undefined) {
      updatePayload.author_id =
        author_id === "" || author_id === null ? null : author_id;
    }

    const { data: blog, error } = await supabase
      .from("blogs")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating blog post:", error);
      return NextResponse.json(
        { error: "Failed to update blog post" },
        { status: 500 },
      );
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error("Error in blog API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
