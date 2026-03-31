import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireMainAdmin } from "@/lib/auth/mainAdmin";
import { tryGetServiceRoleClient } from "@/lib/supabase/serviceRole";
import { isMissingColumn, isMissingTable } from "@/lib/supabase/postgresErrors";

const MIGRATION_HINT =
  "Apply supabase/migrations/20260401120000_create_authors_table.sql in the Supabase SQL editor (or run your usual migration flow).";

function isAuthorsTableMissing(err) {
  return (
    isMissingTable(err) &&
    /authors/i.test(String(err.message || ""))
  );
}

/** GET — list authors with article counts (public). */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authors, error: authorsError } = await supabase
      .from("authors")
      .select("id, name, bio, role, avatar_url, created_at, updated_at")
      .order("name", { ascending: true });

    if (authorsError) {
      console.error("GET /api/authors authors:", authorsError);
      if (isAuthorsTableMissing(authorsError)) {
        return NextResponse.json(
          {
            error: `Authors table not found. ${MIGRATION_HINT}`,
            authors: [],
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        {
          error: authorsError.message || "Failed to fetch authors",
          code: authorsError.code,
        },
        { status: 500 },
      );
    }

    let countBy = {};
    const { data: blogRows, error: blogsError } = await supabase
      .from("blogs")
      .select("author_id");

    if (blogsError) {
      if (isMissingColumn(blogsError)) {
        console.warn(
          "GET /api/authors: blogs.author_id missing; article counts default to 0.",
          blogsError.message,
        );
      } else {
        console.error("GET /api/authors blogs:", blogsError);
        return NextResponse.json(
          {
            error: blogsError.message || "Failed to count articles per author",
            code: blogsError.code,
          },
          { status: 500 },
        );
      }
    } else {
      for (const row of blogRows || []) {
        if (!row.author_id) continue;
        countBy[row.author_id] = (countBy[row.author_id] || 0) + 1;
      }
    }

    const list = (authors || []).map((a) => ({
      ...a,
      article_count: countBy[a.id] || 0,
    }));

    return NextResponse.json({ authors: list });
  } catch (e) {
    console.error("GET /api/authors:", e);
    const message =
      e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST — create author (main admin only). */
export async function POST(request) {
  try {
    const auth = await requireMainAdmin();
    if (auth.response) return auth.response;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const bio =
      typeof body.bio === "string" && body.bio.trim() ? body.bio.trim() : null;
    const role =
      typeof body.role === "string" && body.role.trim() ? body.role.trim() : null;
    const avatar_url =
      typeof body.avatar_url === "string" && body.avatar_url.trim()
        ? body.avatar_url.trim()
        : null;

    const admin = tryGetServiceRoleClient();
    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Set SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase → Project Settings → API).",
        },
        { status: 503 },
      );
    }

    const { data, error } = await admin
      .from("authors")
      .insert([{ name, bio, role, avatar_url }])
      .select("id, name, bio, role, avatar_url, created_at, updated_at")
      .single();

    if (error) {
      console.error("POST /api/authors:", error);
      if (isAuthorsTableMissing(error)) {
        return NextResponse.json(
          { error: `Authors table not found. ${MIGRATION_HINT}` },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to create author" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { author: { ...data, article_count: 0 } },
      { status: 201 },
    );
  } catch (e) {
    console.error("POST /api/authors:", e);
    const message =
      e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
