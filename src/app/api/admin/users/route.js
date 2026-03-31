import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Create service role client for admin operations
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

// Main admin hard guard
const MAIN_ADMIN_EMAIL = "nahednakibyos@gmail.com";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if current user is admin
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!currentUserProfile || currentUserProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all users from profiles table (including current admin)
    const { data: profileUsers, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false });

    if (profileError) {
      console.error("Error fetching profile users:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    console.log(
      "✅ Fetched users from profiles:",
      profileUsers?.length || 0,
      "users"
    );

    // Get all users from auth.users table
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
    } else {
      console.log("✅ Auth users count:", authUsers?.users?.length || 0);
    }

    // Combine users from both sources, prioritizing profiles data
    const profileUserMap = new Map();
    if (profileUsers) {
      profileUsers.forEach((user) => {
        profileUserMap.set(user.id, user);
      });
    }

    const allUsers = [];
    if (authUsers?.users) {
      authUsers.users.forEach((authUser) => {
        const profileUser = profileUserMap.get(authUser.id);
        if (profileUser) {
          // User exists in both tables, use profile data
          allUsers.push(profileUser);
        } else {
          // User exists in auth but not in profiles, create basic user object
          allUsers.push({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || null,
            role: "user", // Default role
            created_at: authUser.created_at,
          });
        }
      });
    }

    // Sort by created_at descending
    allUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    console.log("✅ Combined users:", allUsers.length, "users");
    console.log(
      "Users:",
      allUsers.map((u) => ({ id: u.id, email: u.email, role: u.role }))
    );

    return NextResponse.json({
      users: allUsers,
      total: allUsers.length,
    });
  } catch (error) {
    console.error("Error in users API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { userId } = body;
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const trimmedId = userId.trim();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.email !== MAIN_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Only the main admin can delete users" },
        { status: 403 }
      );
    }

    if (trimmedId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 403 }
      );
    }

    const { data: targetUser, error: targetErr } =
      await supabaseAdmin.auth.admin.getUserById(trimmedId);
    if (targetErr) {
      const msg = (targetErr.message || "").toLowerCase();
      const notFound =
        msg.includes("not found") ||
        msg.includes("invalid") ||
        msg.includes("no user");
      return NextResponse.json(
        { error: targetErr.message || "User not found" },
        { status: notFound ? 400 : 500 }
      );
    }
    if (!targetUser?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    if (targetUser.user.email === MAIN_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Main admin account cannot be deleted" },
        { status: 403 }
      );
    }

    // Remove related user data first to avoid FK constraint failures.
    const cleanupTargets = [
      ["notifications", "user_id"],
      ["notifications", "sender_id"],
      ["notifications", "recipient_id"],
      ["user_comments", "user_id"],
      ["user_likes", "user_id"],
      ["user_favorites", "user_id"],
      ["user_views", "user_id"],
      ["activity_likes", "user_id"],
      ["practice_requests", "user_id"],
      ["practice_requests", "student_id"],
      ["practice_requests", "teacher_id"],
      ["practice_students", "user_id"],
      ["profiles", "id"],
    ];

    for (const [table, column] of cleanupTargets) {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, trimmedId);
      if (!error) {
        continue;
      }

      // Ignore missing tables/columns so this route stays compatible across environments.
      if (error.code === "42P01" || error.code === "42703") {
        continue;
      }

      const message = error.message || "";
      const isConstraintError =
        error.code === "23503" ||
        /foreign key|constraint|violates|referenced|dependent/i.test(message);

      if (isConstraintError) {
        return NextResponse.json(
          { error: message || "Failed to delete related user data" },
          { status: 400 }
        );
      }

      throw new Error(`Failed cleaning ${table}.${column}: ${message}`);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(trimmedId);

    if (deleteError) {
      const msg = deleteError.message || "";
      const constraint =
        /foreign key|constraint|violates|referenced|dependent/i.test(msg);
      return NextResponse.json(
        { error: msg || "Failed to delete user" },
        { status: constraint ? 400 : 500 }
      );
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const { userId, role } = await request.json();

    // Check if user is authenticated and is admin
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent changing the main admin's role
    const { data: targetProfile, error: fetchProfileErr } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (fetchProfileErr) {
      return NextResponse.json(
        { error: fetchProfileErr.message },
        { status: 500 }
      );
    }

    if (targetProfile?.email === MAIN_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Main admin role cannot be changed" },
        { status: 403 }
      );
    }

    // Update user role using service role
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "User role updated successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
