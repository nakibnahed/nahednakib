import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: settings, error } = await supabase
      .from("running_settings")
      .select("show_all_activities, show_support_card")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching running settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Defaults if missing
    const response = {
      show_all_activities: settings?.show_all_activities ?? false,
      show_support_card: settings?.show_support_card ?? true,
    };

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Avoid caching so UI reflects changes immediately
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
