import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    console.log("=== TEST RUNNING SETTINGS API ===");

    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("Session:", session?.user?.id);

    if (!session?.user) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    console.log("Profile:", profile);
    console.log("Profile error:", profileError);

    if (profileError) {
      return NextResponse.json(
        { error: "Profile error", details: profileError },
        { status: 500 }
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Not admin", role: profile?.role },
        { status: 403 }
      );
    }

    // Test service role
    const { createClient: createServiceClient } = await import(
      "@supabase/supabase-js"
    );
    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log("Service client created");

    // Test simple select
    const { data: selectData, error: selectError } = await supabaseService
      .from("running_settings")
      .select("*")
      .single();

    console.log("Select result:", selectData);
    console.log("Select error:", selectError);

    if (selectError) {
      return NextResponse.json(
        { error: "Select error", details: selectError },
        { status: 500 }
      );
    }

    // Test update
    const testData = {
      id: 1,
      show_all_activities: true,
      show_support_card: true,
      updated_at: new Date().toISOString(),
    };

    console.log("Attempting update with:", testData);

    const { data: updateData, error: updateError } = await supabaseService
      .from("running_settings")
      .upsert([testData], { onConflict: "id" })
      .select()
      .single();

    console.log("Update result:", updateData);
    console.log("Update error:", updateError);

    if (updateError) {
      return NextResponse.json(
        { error: "Update error", details: updateError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test completed successfully",
      data: updateData,
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}






