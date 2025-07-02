import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test basic connection
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Database connection error:", error);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Test if engagement tables exist
    const tables = ["user_likes", "user_favorites", "user_comments"];
    const tableChecks = {};

    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select("count")
          .limit(0);
        tableChecks[table] = tableError ? "missing" : "exists";
      } catch (err) {
        tableChecks[table] = "missing";
      }
    }

    return NextResponse.json({
      status: "connected",
      tables: tableChecks,
      message: "Database connection test successful",
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
