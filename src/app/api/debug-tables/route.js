import { supabase } from "@/lib/supabase/client";

export async function GET() {
  try {
    // Test different table names to see what exists
    const tables = [
      "comments",
      "user_comments",
      "likes",
      "user_likes",
      "favorites",
      "user_favorites",
    ];
    const results = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").limit(1);

        if (error) {
          results[table] = { error: error.message };
        } else {
          results[table] = { exists: true, sampleData: data };
        }
      } catch (err) {
        results[table] = { error: err.message };
      }
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
