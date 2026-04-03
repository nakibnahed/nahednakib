import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

// ─── Rate Limiter (in-memory, no packages needed) ────────────────────────────
// Max 10 requests per IP per minute
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

const ipMap = new Map(); // { ip → { count, resetAt } }

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // First request or window expired — reset
    ipMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true; // Too many requests
  }

  entry.count += 1;
  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeEmailInput(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function findUserByEmail(users, normalizedEmail) {
  return users.find((u) => (u.email || "").toLowerCase() === normalizedEmail);
}

function classifyIdentities(user) {
  const identities = user.identities || [];
  const hasEmail = identities.some((i) => i.provider === "email");
  const hasGoogle = identities.some((i) => i.provider === "google");
  return { hasEmail, hasGoogle };
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    // Rate limit check
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 },
      );
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const emailRaw = body?.email;
    const email = normalizeEmailInput(emailRaw);
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    const perPage = 1000;
    let page = 1;
    let matched = null;

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error("check-email listUsers:", error);
        return NextResponse.json(
          { error: "Unable to check email" },
          { status: 500 },
        );
      }

      const users = data?.users ?? [];
      matched = findUserByEmail(users, email);
      if (matched) break;

      if (users.length < perPage) break;
      page += 1;
    }

    if (!matched) {
      return NextResponse.json({ status: "not_found" });
    }

    const { hasEmail, hasGoogle } = classifyIdentities(matched);

    if (hasEmail) {
      return NextResponse.json({ status: "has_password" });
    }
    if (hasGoogle) {
      return NextResponse.json({ status: "google_only" });
    }

    return NextResponse.json({ status: "has_password" });
  } catch (err) {
    console.error("check-email:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
