import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendNewPostEmail } from "@/services/mailer";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  // Require admin auth
  const serverClient = await createServerClient();
  const { data: { user }, error: authError } = await serverClient.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { blog } = await req.json();
  if (!blog?.title) {
    return Response.json({ error: "Blog data required" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nahednakib.com";

  const { data: subscribers } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("email, unsubscribe_token")
    .eq("subscribed", true);

  if (!subscribers?.length) {
    return Response.json({ message: "No active subscribers", sent: 0 });
  }

  const results = await Promise.allSettled(
    subscribers.map((sub) =>
      sendNewPostEmail(sub.email, sub.unsubscribe_token, blog, siteUrl)
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;

  console.log(`Newsletter broadcast: ${sent} sent, ${failed} failed`);
  return Response.json({ message: "Broadcast complete", sent, failed });
}
