import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sendPracticeCancellationEmail } from "@/services/mailer";

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

    const { requestId, reason } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const { data: row, error: getErr } = await supabaseAdmin
      .from("practice_requests")
      .select("*")
      .eq("id", requestId)
      .eq("status", "accepted")
      .maybeSingle();

    if (getErr || !row) {
      return NextResponse.json({ error: "Accepted request not found" }, { status: 404 });
    }

    const isParticipant =
      row.from_user_id === session.user.id || row.to_user_id === session.user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const cancelledByName =
      row.from_user_id === session.user.id ? row.from_name : row.to_name;
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
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const actorIsFrom =
      row.from_user_id === session.user.id;

    const recipientName = actorIsFrom ? row.to_name : row.from_name;
    const recipientEmail = actorIsFrom ? row.to_email : row.from_email;
    const recipientUserId = actorIsFrom ? row.to_user_id : row.from_user_id;

    if (recipientUserId) {
      await supabaseAdmin.from("notifications").insert({
        title: "Conversation Practice Cancelled",
        message: `${cancelledByName} cancelled your conversation practice meeting.`,
        type: "practice_cancelled",
        recipient_id: recipientUserId,
        sender_id: session.user.id,
        is_admin_notification: false,
        is_read: false,
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
