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
    const {
      title,
      description,
      image_url,
      project_url,
      github_url,
      technologies,
      slug,
      published = false,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Create portfolio item (assuming you have a portfolios table)
    const { data: portfolio, error } = await supabase
      .from("portfolios")
      .insert([
        {
          title,
          description,
          image_url,
          project_url,
          github_url,
          technologies,
          slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
          published,
          author_id: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating portfolio item:", error);
      return NextResponse.json(
        { error: "Failed to create portfolio item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error("Error in portfolio API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get published portfolio items
    const { data: portfolios, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching portfolios:", error);
      return NextResponse.json(
        { error: "Failed to fetch portfolios" },
        { status: 500 }
      );
    }

    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error("Error in portfolio API:", error);
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
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Portfolio ID is required" },
        { status: 400 }
      );
    }

    // Get current portfolio item to check if it was unpublished before
    const { data: currentPortfolio } = await supabase
      .from("portfolios")
      .select("published")
      .eq("id", id)
      .single();

    const wasUnpublished = currentPortfolio && !currentPortfolio.published;

    // Update portfolio item
    const { data: portfolio, error } = await supabase
      .from("portfolios")
      .update({
        title,
        description,
        image_url,
        project_url,
        github_url,
        technologies,
        slug,
        published,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating portfolio item:", error);
      return NextResponse.json(
        { error: "Failed to update portfolio item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error("Error in portfolio API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
