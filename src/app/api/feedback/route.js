// src/app/api/feedback/route.js
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRateLimiter, getIp } from "@/lib/rateLimit";

const isRateLimited = createRateLimiter("feedback", 5, 60 * 1000);

export async function POST(request) {
  try {
    const ip = getIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookies().getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies().set(name, value, options)
            );
          },
        },
      }
    );

    const { name, email, feedback, rating, category } = await request.json();

    console.log("Form received:", { name, email, feedback, rating, category });

    if (!name || !email || !feedback) {
      return NextResponse.json(
        { error: "Name, email, and feedback are required" },
        { status: 400 }
      );
    }

    if (
      typeof name !== "string" || name.length > 100 ||
      typeof email !== "string" || email.length > 254 ||
      typeof feedback !== "string" || feedback.length > 5000
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("feedback_messages")
      .insert([
        {
          name: name.trim(),
          email: email.trim(),
          feedback: feedback.trim(),
          rating: rating || null,
          category: category || "general",
        },
      ])
      .select()
      .single();

    console.log("Insert result:", { data, error });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Feedback submitted!", data });
  } catch (err) {
    console.error("API POST error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
