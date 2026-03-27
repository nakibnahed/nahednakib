import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendPracticeMeetingEmail } from "@/services/mailer";

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

    // Generate a unique room name tied to this request.
    // Using meet.ffmuc.net — free public Jitsi server, no moderator/login required.
    const roomName = `practice${requestId.replace(/-/g, "").slice(0, 20)}`;
    const meetLink = `https://meet.ffmuc.net/${roomName}`;

    const { data: requestRow, error: requestErr } = await supabaseAdmin
      .from("practice_requests")
      .select("*")
      .eq("id", requestId)
      .eq("status", "pending")
      .maybeSingle();

    if (requestErr || !requestRow) {
      return new Response(JSON.stringify({ error: "Request not found or already resolved" }), { status: 404 });
    }

    const { error: updateReqErr } = await supabaseAdmin
      .from("practice_requests")
      .update({
        status: "accepted",
        meet_link: meetLink,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateReqErr) {
      return new Response(JSON.stringify({ error: updateReqErr.message }), { status: 500 });
    }

    // Remove both students from availability list after match accepted
    if (requestRow.from_user_id) {
      await supabaseAdmin
        .from("practice_students")
        .update({ status: "busy", available_until: new Date().toISOString() })
        .eq("user_id", requestRow.from_user_id);
    }

    if (requestRow.to_user_id) {
      await supabaseAdmin
        .from("practice_students")
        .update({ status: "busy", available_until: new Date().toISOString() })
        .eq("user_id", requestRow.to_user_id);
    }

    try {
      await sendPracticeMeetingEmail({
        requesterName: requestRow.from_name,
        recipientName: requestRow.to_name,
        requesterEmail: requestRow.from_email,
        recipientEmail: requestRow.to_email,
        meetLink,
        suggestedTime: requestRow.suggested_time,
      });
    } catch (emailErr) {
      console.error("Practice email error:", emailErr);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500 });
  }
}
