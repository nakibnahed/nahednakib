import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendPracticeIncomingRequestEmail } from "@/services/mailer";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return new Response(JSON.stringify({ error: "requestId is required" }), { status: 400 });
    }

    const { data: requestRow, error } = await supabaseAdmin
      .from("practice_requests")
      .select("id, from_name, to_name, to_email")
      .eq("id", requestId)
      .maybeSingle();

    if (error || !requestRow) {
      return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const requestsPageUrl = `${baseUrl}/conversation-practice?tab=requests#incoming-requests`;

    try {
      await sendPracticeIncomingRequestEmail({
        recipientName: requestRow.to_name,
        recipientEmail: requestRow.to_email,
        requesterName: requestRow.from_name,
        requestsPageUrl,
      });
    } catch (mailErr) {
      console.error("Practice request notify email error:", mailErr);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500 });
  }
}
