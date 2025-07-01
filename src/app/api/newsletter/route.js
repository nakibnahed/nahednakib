import { supabase } from "@/services/supabaseClient";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
      });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("email", email)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email already subscribed" }),
        {
          status: 400,
        }
      );
    }

    // Insert new subscriber
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert([{ email, subscribed: true }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ message: "Successfully subscribed to newsletter!" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
