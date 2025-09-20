import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: settings, error } = await supabase
      .from("running_settings")
      .select("show_all_activities")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching running settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Return default settings if no settings found
    const defaultSettings = {
      show_all_activities: false,
    };

    return NextResponse.json(settings || defaultSettings);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
