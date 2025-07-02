import { supabase } from "@/services/supabaseClient";

export async function GET() {
  try {
    console.log("Testing Supabase connection...");

    // Test basic connection
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("Supabase test error:", error);

      if (
        error.message?.includes(
          'relation "newsletter_subscribers" does not exist'
        )
      ) {
        return new Response(
          JSON.stringify({
            status: "error",
            message:
              "Newsletter table does not exist. Please create it in Supabase dashboard.",
            error: error.message,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          status: "error",
          message: "Database connection failed",
          error: error.message,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Newsletter table exists and is accessible",
        count: data?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Test API error:", err);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Unexpected error",
        error: err.message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
