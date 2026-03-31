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
    const {
      title,
      description,
      image_url,
      project_url,
      github_url,
      technologies,
      slug,
      published = false,
      author_id,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 },
      );
    }

    const insertRow = {
      title,
      description,
      image_url,
      project_url,
      github_url,
      technologies,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
      published,
    };

    if (author_id !== undefined && author_id !== null && author_id !== "") {
      insertRow.author_id = author_id;
    }

    const { data: portfolio, error } = await supabase
      .from("portfolios")
      .insert([insertRow])
      .select()
      .single();

    if (error) {
      console.error("Error creating portfolio item:", error);
      return NextResponse.json(
        { error: "Failed to create portfolio item" },
        { status: 500 },
      );
    }

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error("Error in portfolio API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: portfolios, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching portfolios:", error);
      return NextResponse.json(
        { error: "Failed to fetch portfolios" },
        { status: 500 },
      );
    }

    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error("Error in portfolio API:", error);
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
    const {
      id,
      title,
      description,
      image_url,
      project_url,
      github_url,
      technologies,
      slug,
      published,
      author_id,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Portfolio ID is required" },
        { status: 400 },
      );
    }

    const updatePayload = {
      title,
      description,
      image_url,
      project_url,
      github_url,
      technologies,
      slug,
      published,
    };

    if (author_id !== undefined) {
      updatePayload.author_id =
        author_id === "" || author_id === null ? null : author_id;
    }

    const { data: portfolio, error } = await supabase
      .from("portfolios")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating portfolio item:", error);
      return NextResponse.json(
        { error: "Failed to update portfolio item" },
        { status: 500 },
      );
    }

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error("Error in portfolio API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
