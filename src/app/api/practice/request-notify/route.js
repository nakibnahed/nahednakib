import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sendPracticeIncomingRequestEmail } from "@/services/mailer";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const { data: requestRow, error } = await supabaseAdmin
      .from("practice_requests")
      .select("id, from_name, from_user_id, to_name, to_email, to_user_id")
      .eq("id", requestId)
      .maybeSingle();

    if (error || !requestRow) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (requestRow.from_user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the requester can send request notification" },
        { status: 403 },
      );
    }

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
        });
      if (notifErr) {
        console.error("[request-notify] notification insert FAILED:", notifErr.message);
      }
    }

    if (requestRow.to_email) {
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
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
