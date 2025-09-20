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
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Return default settings if no settings found
    const defaultSettings = {
      id: 1,
      show_all_activities: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(data || defaultSettings);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const { show_all_activities } = body;

    if (typeof show_all_activities !== "boolean") {
      return NextResponse.json(
        { error: "Invalid show_all_activities value" },
        { status: 400 }
      );
    }

    const settingsData = {
      id: 1, // Single settings record
      show_all_activities,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("running_settings")
      .upsert([settingsData], { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Error saving running settings:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
