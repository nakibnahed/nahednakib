// Simple test to check if feedback_messages table exists
const { createClient } = require("@supabase/supabase-js");

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY";

if (supabaseUrl === "YOUR_SUPABASE_URL") {
  console.log("❌ Please update the Supabase credentials in this file first");
  console.log(
    "You can find them in your Supabase dashboard under Settings > API"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFeedbackTable() {
  try {
    console.log("🔍 Testing feedback_messages table...");

    // Try to query the table
    const { data, error } = await supabase
      .from("feedback_messages")
      .select("*")
      .limit(1);

    if (error) {
      if (
        error.message.includes('relation "feedback_messages" does not exist')
      ) {
        console.log("❌ feedback_messages table does not exist!");
        console.log("");
        console.log(
          "📋 To fix this, run the SQL from feedback_database_setup.sql in your Supabase dashboard:"
        );
        console.log("1. Go to your Supabase dashboard");
        console.log("2. Navigate to SQL Editor");
        console.log(
          "3. Copy and paste the contents of feedback_database_setup.sql"
        );
        console.log("4. Run the SQL");
        console.log("");
        console.log("Or you can run the SQL directly from the file:");
        console.log("cat feedback_database_setup.sql");
      } else {
        console.log(
          "❌ Error querying feedback_messages table:",
          error.message
        );
      }
    } else {
      console.log("✅ feedback_messages table exists and is accessible!");
      console.log("📊 Found", data.length, "records in the table");
    }
  } catch (err) {
    console.log("❌ Connection error:", err.message);
    console.log("");
    console.log("🔧 Make sure your Supabase credentials are correct:");
    console.log("- Check your .env.local file");
    console.log("- Verify your Supabase project URL and API key");
  }
}

testFeedbackTable();
