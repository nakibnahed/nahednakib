import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    console.log("🔍 GET /api/notifications - Starting request");

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session check:", {
      hasSession: !!session,
      sessionError,
      userId: session?.user?.id,
    });

    if (!session?.user) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("Query params:", { limit, offset, userId: session.user.id });

    // First, let's check if the notifications table exists
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from("notifications")
        .select("count")
        .limit(1);

      if (tableError) {
        console.error("❌ Table check error:", tableError);
        return NextResponse.json(
          {
            error: "Notifications table error",
            details: tableError.message,
            code: tableError.code,
          },
          { status: 500 }
        );
      }
      console.log("✅ Notifications table exists");
    } catch (tableCheckError) {
      console.error("❌ Table check failed:", tableCheckError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: tableCheckError.message,
        },
        { status: 500 }
      );
    }

    // Test a simple query first
    try {
      const { data: testData, error: testError } = await supabase
        .from("notifications")
        .select("id")
        .eq("recipient_id", session.user.id)
        .limit(1);

      if (testError) {
        console.error("❌ Test query error:", testError);
        return NextResponse.json(
          {
            error: "Test query failed",
            details: testError.message,
            code: testError.code,
            hint: "This might be a RLS policy issue",
          },
          { status: 500 }
        );
      }
      console.log(
        "✅ Test query successful, found:",
        testData?.length || 0,
        "records"
      );
    } catch (testQueryError) {
      console.error("❌ Test query exception:", testQueryError);
      return NextResponse.json(
        { error: "Test query exception", details: testQueryError.message },
        { status: 500 }
      );
    }

    // Get user's notifications
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(
        `
        id,
        title,
        message,
        type,
        is_read,
        is_admin_notification,
        related_content_type,
        related_content_id,
        created_at,
        read_at,
        sender_id,
        recipient_id
      `
      )
      .eq("recipient_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("❌ Error fetching notifications:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch notifications",
          details: error.message,
          code: error.code,
          hint: "Check RLS policies for notifications table",
        },
        { status: 500 }
      );
    }

    console.log("✅ Fetched notifications:", notifications?.length || 0);

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", session.user.id)
      .eq("is_read", false);

    if (countError) {
      console.error("❌ Error counting unread:", countError);
    }

    console.log("✅ Unread count:", unreadCount || 0);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("❌ Unexpected error in notifications API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log("🔍 POST /api/notifications - Starting request");

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session check:", { hasSession: !!session, sessionError });

    if (!session?.user) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { notificationId, markAllAsRead } = await request.json();
    console.log("Request body:", { notificationId, markAllAsRead });

    if (markAllAsRead) {
      // Mark all notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("recipient_id", session.user.id)
        .eq("is_read", false);

      if (error) {
        console.error("❌ Error marking all as read:", error);
        return NextResponse.json(
          {
            error: "Failed to mark notifications as read",
            details: error.message,
          },
          { status: 500 }
        );
      }

      console.log("✅ Marked all notifications as read");
      return NextResponse.json({
        message: "All notifications marked as read",
      });
    }

    if (!notificationId) {
      console.log("❌ No notification ID provided");
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Mark specific notification as read
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("recipient_id", session.user.id);

    if (error) {
      console.error("❌ Error marking notification as read:", error);
      return NextResponse.json(
        {
          error: "Failed to mark notification as read",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Marked notification as read:", notificationId);
    return NextResponse.json({
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("❌ Unexpected error in notifications POST API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
