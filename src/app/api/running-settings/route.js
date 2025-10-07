import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("running_settings")
      .select("*")
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error fetching running settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings", details: error.message },
        { status: 500 }
      );
    }

    // Return default settings if no settings found
    const defaultSettings = {
      id: 1,
      show_all_activities: false,
      show_support_card: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Ensure show_support_card is always present in response
    const responseData = data || defaultSettings;
    if (responseData.show_support_card === undefined) {
      responseData.show_support_card = true;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { show_all_activities, show_support_card } = body;

    if (typeof show_all_activities !== "boolean") {
      return NextResponse.json(
        { error: "Invalid show_all_activities value" },
        { status: 400 }
      );
    }

    // Make show_support_card optional for backward compatibility
    if (
      show_support_card !== undefined &&
      typeof show_support_card !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid show_support_card value" },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const updatePayload = {
      show_all_activities,
      show_support_card:
        show_support_card !== undefined ? show_support_card : true,
      updated_at: nowIso,
    };

    // Prefer UPDATE of existing row (id=1)
    const {
      data: updateData,
      error: updateError,
      count,
    } = await supabase
      .from("running_settings")
      .update(updatePayload)
      .eq("id", 1)
      .select()
      .single();

    if (!updateError && updateData) {
      return NextResponse.json(updateData);
    }

    // If update failed due to no row, try INSERT (first-time setup)
    const insertPayload = {
      id: 1,
      show_all_activities: updatePayload.show_all_activities,
      show_support_card: updatePayload.show_support_card,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { data: insertData, error: insertError } = await supabase
      .from("running_settings")
      .insert([insertPayload])
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert running settings:", insertError);
      return NextResponse.json(
        {
          error: "Failed to save settings",
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(insertData);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
