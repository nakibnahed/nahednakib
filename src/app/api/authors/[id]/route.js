import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireMainAdmin } from "@/lib/auth/mainAdmin";
import { tryGetServiceRoleClient } from "@/lib/supabase/serviceRole";
import { DEFAULT_UNKNOWN_AUTHOR_ID } from "@/constants/defaultAuthor";
import { isMissingColumn, isMissingTable } from "@/lib/supabase/postgresErrors";

const MIGRATION_HINT =
  "Apply supabase/migrations/20260401120000_create_authors_table.sql in Supabase.";

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(s || "").trim(),
  );
}

/** GET — author detail + articles (public). */
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid author id" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: author, error: authorError } = await supabase
      .from("authors")
      .select("id, name, bio, role, avatar_url, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (authorError) {
      console.error("GET /api/authors/[id] author:", authorError);
      if (
        isMissingTable(authorError) &&
        /authors/i.test(String(authorError.message || ""))
      ) {
        return NextResponse.json(
          { error: `Authors table not found. ${MIGRATION_HINT}` },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: authorError.message || "Failed to load author" },
        { status: 500 },
      );
    }

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const { data: articles, error: articlesError } = await supabase
      .from("blogs")
      .select(
        `
        id,
        title,
        slug,
        description,
        image,
        created_at,
        published,
        categories ( id, name, slug, color )
      `,
      )
      .eq("author_id", id)
      .order("created_at", { ascending: false });

    if (articlesError) {
      if (isMissingColumn(articlesError)) {
        console.warn(
          "GET /api/authors/[id]: blogs.author_id missing;",
          articlesError.message,
        );
        return NextResponse.json({ author, articles: [] });
      }
      console.error("GET /api/authors/[id] blogs:", articlesError);
      return NextResponse.json(
        { error: articlesError.message || "Failed to load articles" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      author,
      articles: articles || [],
    });
  } catch (e) {
    console.error("GET /api/authors/[id]:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** PUT — update author (main admin only). */
export async function PUT(request, { params }) {
  try {
    const auth = await requireMainAdmin();
    if (auth.response) return auth.response;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid author id" }, { status: 400 });
    }

    if (id === DEFAULT_UNKNOWN_AUTHOR_ID) {
      return NextResponse.json(
        { error: "The default Unknown author cannot be modified" },
        { status: 403 },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const patch = {};
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      patch.name = name;
    }
    if (body.bio !== undefined) {
      patch.bio =
        typeof body.bio === "string" && body.bio.trim() ? body.bio.trim() : null;
    }
    if (body.role !== undefined) {
      patch.role =
        typeof body.role === "string" && body.role.trim() ? body.role.trim() : null;
    }
    if (body.avatar_url !== undefined) {
      patch.avatar_url =
        typeof body.avatar_url === "string" && body.avatar_url.trim()
          ? body.avatar_url.trim()
          : null;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

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
      .update(patch)
      .eq("id", id)
      .select("id, name, bio, role, avatar_url, created_at, updated_at")
      .maybeSingle();

    if (error) {
      console.error("PUT /api/authors/[id]:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update author" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    return NextResponse.json({ author: data });
  } catch (e) {
    console.error("PUT /api/authors/[id]:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE — remove author; articles keep existing (reassign or nullify).
 * Query: ?strategy=reassign&reassignTo=<uuid> | ?strategy=nullify (default)
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await requireMainAdmin();
    if (auth.response) return auth.response;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid author id" }, { status: 400 });
    }

    if (id === DEFAULT_UNKNOWN_AUTHOR_ID) {
      return NextResponse.json(
        { error: "The default Unknown author cannot be deleted" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const strategy = (searchParams.get("strategy") || "nullify").toLowerCase();
    const reassignToRaw = searchParams.get("reassignTo");
    const reassignTo =
      reassignToRaw && isUuid(reassignToRaw)
        ? reassignToRaw.trim()
        : DEFAULT_UNKNOWN_AUTHOR_ID;

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

    if (strategy === "reassign") {
      if (reassignTo === id) {
        return NextResponse.json(
          { error: "reassignTo must differ from the author being deleted" },
          { status: 400 },
        );
      }
      const { error: bErr } = await admin
        .from("blogs")
        .update({ author_id: reassignTo })
        .eq("author_id", id);
      if (bErr) {
        console.error("DELETE author reassign blogs:", bErr);
        return NextResponse.json(
          { error: bErr.message || "Failed to reassign articles" },
          { status: 500 },
        );
      }
      const { error: pErr } = await admin
        .from("portfolios")
        .update({ author_id: reassignTo })
        .eq("author_id", id);
      if (pErr) {
        console.error("DELETE author reassign portfolios:", pErr);
        return NextResponse.json(
          { error: pErr.message || "Failed to reassign portfolios" },
          { status: 500 },
        );
      }
    } else if (strategy === "nullify") {
      const { error: bErr } = await admin
        .from("blogs")
        .update({ author_id: null })
        .eq("author_id", id);
      if (bErr) {
        console.error("DELETE author nullify blogs:", bErr);
        return NextResponse.json(
          { error: bErr.message || "Failed to update articles" },
          { status: 500 },
        );
      }
      const { error: pErr } = await admin
        .from("portfolios")
        .update({ author_id: null })
        .eq("author_id", id);
      if (pErr) {
        console.error("DELETE author nullify portfolios:", pErr);
        return NextResponse.json(
          { error: pErr.message || "Failed to update portfolios" },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "strategy must be nullify or reassign" },
        { status: 400 },
      );
    }

    const { error: delErr } = await admin.from("authors").delete().eq("id", id);
    if (delErr) {
      console.error("DELETE author:", delErr);
      return NextResponse.json(
        { error: delErr.message || "Failed to delete author" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Author deleted successfully" });
  } catch (e) {
    console.error("DELETE /api/authors/[id]:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
