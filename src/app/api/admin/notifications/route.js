import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Create service role client for admin operations
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    console.log("🔍 POST /api/admin/notifications - Starting request");

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

    // Check if user is admin (simplified check)
    // For now, allow any authenticated user to send notifications
    // You can add more specific admin checks later
    console.log("✅ Admin access confirmed for user:", session.user.email);

    const {
      title,
      message,
      type,
      recipientIds,
      isGlobal,
      recipient_type,
      related_content_type,
      related_content_id,
    } = await request.json();

    console.log("Request data:", {
      title,
      message,
      type,
      recipientIds,
      isGlobal,
      recipient_type,
      related_content_type,
      related_content_id,
    });

    if (!title || !message) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    let usersToNotify = [];

    if (recipient_type === "newsletter_subscribers") {
      const { data: newsletterRows, error: newsletterError } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .eq("subscribed", true);

      console.log("subscribers found: " + ((newsletterRows || []).length || 0));

      if (newsletterError) {
        console.error("❌ Error fetching newsletter subscribers:", newsletterError);
        return NextResponse.json(
          {
            error: "Failed to fetch newsletter subscribers",
            details: newsletterError.message,
          },
          { status: 500 }
        );
      }

      const subscriberEmails = Array.from(
        new Set(
          (newsletterRows || [])
            .map((row) => (row.email || "").trim().toLowerCase())
            .filter(Boolean)
        )
      );

      if (subscriberEmails.length > 0) {
        const { data: matchedProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email")
          .in("email", subscriberEmails);

        if (profilesError) {
          console.error(
            "❌ Error matching newsletter subscribers to profiles:",
            profilesError
          );
          return NextResponse.json(
            { error: "Failed to match recipients", details: profilesError.message },
            { status: 500 }
          );
        }

        usersToNotify = (matchedProfiles || []).map((profile) => ({
          id: profile.id,
        }));
        console.log("matched profiles: " + ((matchedProfiles || []).length || 0));
      } else {
        console.log("matched profiles: 0");
      }
      console.log(
        "✅ Newsletter subscriber notification to",
        usersToNotify.length,
        "matched users"
      );
    } else if (recipient_type === "all_users" || isGlobal) {
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("id");

      if (usersError) {
        console.error("❌ Error fetching users:", usersError);
        return NextResponse.json(
          { error: "Failed to fetch users", details: usersError.message },
          { status: 500 }
        );
      }

      usersToNotify = allUsers || [];
      console.log("✅ Global notification to", usersToNotify.length, "users");
    } else if (
      recipient_type === "specific_users" ||
      (recipientIds && recipientIds.length > 0)
    ) {
      usersToNotify = (recipientIds || []).map((id) => ({ id }));
      console.log("✅ Targeted notification to", usersToNotify.length, "users");
    } else {
      console.log("❌ No recipients specified");
      return NextResponse.json(
        {
          error:
            "Must specify recipients via recipient_type or provide recipient IDs",
        },
        { status: 400 }
      );
    }

    if (usersToNotify.length === 0) {
      console.log("❌ No valid recipients found");
      return NextResponse.json(
        { error: "No valid recipients found" },
        { status: 400 }
      );
    }

    // Create notifications for all recipients
    const notifications = usersToNotify.map((user) => ({
      title,
      message,
      type: type || "admin_message",
      recipient_id: user.id,
      sender_id: session.user.id,
      is_admin_notification: true,
      is_read: false,
      related_content_type: related_content_type || null,
      related_content_id: related_content_id || null,
      updated_at: new Date().toISOString(),
    }));

    console.log("Creating notifications:", notifications);

    const { data: createdNotifications, error: createError } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    console.log(
      "notifications inserted: " +
        (createError
          ? `error: ${createError.message}`
          : (createdNotifications || []).length || 0)
    );

    if (createError) {
      console.error("❌ Error creating notifications:", createError);
      return NextResponse.json(
        {
          error: "Failed to create notifications",
          details: createError.message,
          code: createError.code,
        },
        { status: 500 }
      );
    }

    console.log(
      "✅ Created",
      createdNotifications?.length || 0,
      "notifications"
    );

    return NextResponse.json({
      message: `Successfully sent ${
        createdNotifications?.length || 0
      } notifications`,
      notifications: createdNotifications,
    });
  } catch (error) {
    console.error(
      "❌ Unexpected error in admin notifications POST API:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    console.log("🔍 GET /api/admin/notifications - Starting request");

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

    // Check if user is admin (simplified check)
    // For now, allow any authenticated user to send notifications
    // You can add more specific admin checks later
    console.log("✅ Admin access confirmed for user:", session.user.email);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("Query params:", { limit, offset });

    // Check if notifications table exists
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

    // Get all notifications for admin view
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

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ Error counting total:", countError);
    }

    console.log("✅ Total count:", totalCount || 0);

    return NextResponse.json({
      notifications: notifications || [],
      totalCount: totalCount || 0,
    });
  } catch (error) {
    console.error("❌ Unexpected error in admin notifications API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
