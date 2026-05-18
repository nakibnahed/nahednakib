import { supabase } from "@/services/supabaseClient";
import { sendContactEmail } from "@/services/mailer";
import { createRateLimiter, getIp } from "@/lib/rateLimit";

const isRateLimited = createRateLimiter("contact", 5, 60 * 1000);

export async function POST(req) {
  try {
    const ip = getIp(req);
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
        status: 429,
      });
    }

    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    if (
      typeof name !== "string" || name.length > 100 ||
      typeof email !== "string" || email.length > 254 ||
      typeof message !== "string" || message.length > 5000
    ) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
      });
    }

    // Insert into Supabase
    const { error } = await supabase
      .from("contact_messages")
      .insert([{ name, email, message }]);
    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
      });
    }

    // Send welcome email
    await sendContactEmail({ name, email, message });

    return new Response(
      JSON.stringify({ message: "Message sent successfully" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
