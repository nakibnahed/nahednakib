import { supabase } from "@/services/supabaseClient";
import { sendProjectInquiryEmail } from "@/services/mailer";
import { createRateLimiter, getIp } from "@/lib/rateLimit";

const isRateLimited = createRateLimiter("project-inquiry", 5, 60 * 1000);

export async function POST(req) {
  try {
    const ip = getIp(req);
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
        status: 429,
      });
    }

    const { name, email, projectType, description, features, timeline, notes } =
      await req.json();

    if (!name || !email || !projectType || !description) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    if (
      typeof name !== "string" || name.length > 100 ||
      typeof email !== "string" || email.length > 254 ||
      typeof description !== "string" || description.length > 10000 ||
      (notes && typeof notes === "string" && notes.length > 5000)
    ) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
      });
    }

    const { error } = await supabase
      .from("project_inquiries")
      .insert([{
        name,
        email,
        project_type: projectType,
        description,
        features: features || null,
        timeline: timeline || null,
        notes: notes || null,
      }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
      });
    }

    await sendProjectInquiryEmail({
      name,
      email,
      projectType,
      description,
      features,
      timeline,
      notes,
    });

    return new Response(
      JSON.stringify({ message: "Project brief submitted successfully" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
