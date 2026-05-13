import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAuthenticatedUser() {
  const serverClient = await createServerClient();
  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return null;
  return user;
}

// GET /api/newsletter/me — returns subscription status for the current user
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("subscribed, subscribed_at")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({
    subscribed: data?.subscribed ?? false,
    subscribed_at: data?.subscribed_at ?? null,
  });
}

// PATCH /api/newsletter/me — { action: "unsubscribe" | "subscribe" }
export async function PATCH(req) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json();
  if (!["subscribe", "unsubscribe"].includes(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const email = user.email.toLowerCase();
  const { data: existing } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id, subscribed")
    .eq("email", email)
    .maybeSingle();

  if (action === "unsubscribe") {
    if (!existing || !existing.subscribed) {
      return Response.json({ message: "Already unsubscribed" });
    }
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
      .eq("email", email);

    if (error) return Response.json({ error: "Database error" }, { status: 500 });
    return Response.json({ message: "Unsubscribed successfully" });
  }

  // action === "subscribe"
  if (existing) {
    if (existing.subscribed) {
      return Response.json({ message: "Already subscribed" });
    }
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({ subscribed: true, subscribed_at: new Date().toISOString(), unsubscribed_at: null })
      .eq("email", email);

    if (error) return Response.json({ error: "Database error" }, { status: 500 });
  } else {
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({ email, subscribed: true, subscribed_at: new Date().toISOString() });

    if (error) return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({ message: "Subscribed successfully" });
}
