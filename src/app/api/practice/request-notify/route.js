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
      return new Response(JSON.stringify({ error: "requestId is required" }), {
        status: 400,
      });
    }

    const { data: requestRow, error } = await supabaseAdmin
      .from("practice_requests")
      .select("id, from_name, from_user_id, to_name, to_email, to_user_id")
      .eq("id", requestId)
      .maybeSingle();

    if (error || !requestRow) {
      console.error("[request-notify] Request not found:", requestId, error?.message);
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
      });
    }

    console.log("[request-notify] requestRow:", {
      id: requestRow.id,
      from_name: requestRow.from_name,
      from_user_id: requestRow.from_user_id,
      to_name: requestRow.to_name,
      to_user_id: requestRow.to_user_id,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const requestsPageUrl = `${baseUrl}/conversation-practice?tab=requests#incoming-requests`;

    if (requestRow.to_user_id) {
      const { error: notifErr } = await supabaseAdmin
        .from("notifications")
        .insert({
          title: "New Conversation Practice Request",
          message: `${requestRow.from_name} sent you a conversation practice request.`,
          type: "practice_request",
          recipient_id: requestRow.to_user_id,
          sender_id: requestRow.from_user_id || null,
          is_admin_notification: false,
          is_read: false,
          related_content_type: "practice_request",
          related_content_id: requestRow.id,
          updated_at: new Date().toISOString(),
        });
      if (notifErr) {
        console.error(
          "[request-notify] notification insert FAILED:",
          notifErr.message,
          notifErr.details,
          notifErr.hint,
        );
      } else {
        console.log(
          "[request-notify] notification inserted OK for recipient:",
          requestRow.to_user_id,
        );
      }
    } else {
      console.log(
        `[request-notify] to_user_id is null for request ${requestId} — skipping in-app notification`,
      );
    }

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
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500 },
    );
  }
}
