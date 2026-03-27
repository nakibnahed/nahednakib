import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendPracticeCancellationEmail } from "@/services/mailer";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { requestId, actorUserId, actorEmail, actorName, reason } =
      await req.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: "requestId is required" }), {
        status: 400,
      });
    }

    const { data: row, error: getErr } = await supabaseAdmin
      .from("practice_requests")
      .select("*")
      .eq("id", requestId)
      .eq("status", "accepted")
      .maybeSingle();

    if (getErr || !row) {
      return new Response(
        JSON.stringify({ error: "Accepted request not found" }),
        { status: 404 },
      );
    }

    const emailNorm = (actorEmail || "").trim().toLowerCase();
    const isParticipant =
      (actorUserId &&
        (row.from_user_id === actorUserId || row.to_user_id === actorUserId)) ||
      (emailNorm &&
        ((row.from_email || "").trim().toLowerCase() === emailNorm ||
          (row.to_email || "").trim().toLowerCase() === emailNorm));

    if (!isParticipant) {
      return new Response(JSON.stringify({ error: "Not allowed" }), {
        status: 403,
      });
    }

    const cancelledByName = actorName || "Participant";
    const cancelledAt = new Date().toISOString();
    const safeReason = (reason || "").trim().slice(0, 300);

    const { error: updateErr } = await supabaseAdmin
      .from("practice_requests")
      .update({
        status: "cancelled",
        cancelled_at: cancelledAt,
        cancelled_by_name: cancelledByName,
        cancellation_reason: safeReason || null,
      })
      .eq("id", requestId)
      .eq("status", "accepted");

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
      });
    }

    const actorIsFrom =
      (actorUserId && row.from_user_id === actorUserId) ||
      (emailNorm && (row.from_email || "").trim().toLowerCase() === emailNorm);

    const recipientName = actorIsFrom ? row.to_name : row.from_name;
    const recipientEmail = actorIsFrom ? row.to_email : row.from_email;
    const recipientUserId = actorIsFrom ? row.to_user_id : row.from_user_id;

    if (recipientUserId) {
      await supabaseAdmin.from("notifications").insert({
        title: "Conversation Practice Cancelled",
        message: `${cancelledByName} cancelled your conversation practice meeting.`,
        type: "practice_cancelled",
        recipient_id: recipientUserId,
        is_admin_notification: false,
        is_read: false,
        updated_at: cancelledAt,
      });
    }

    try {
      await sendPracticeCancellationEmail({
        recipientName,
        recipientEmail,
        cancelledByName,
        suggestedTime: row.suggested_time,
        reason: safeReason,
      });
    } catch (emailErr) {
      console.error("Practice cancellation email error:", emailErr);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500 },
    );
  }
}
