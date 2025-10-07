// Test database connection and feedback table
import { supabase } from "./src/services/supabaseClient.js";

async function testDatabaseConnection() {
  try {
    console.log("🔍 Testing database connection...");

    // Test 1: Check if feedback_messages table exists
    console.log("📋 Checking if feedback_messages table exists...");
    const { data, error } = await supabase
      .from("feedback_messages")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Database error:", error.message);
      console.log("🔧 You need to run the database setup SQL first!");
      console.log(
        "📄 Run the SQL from feedback_database_setup.sql in your Supabase dashboard"
      );
      return;
    }

    console.log("✅ Database connection successful!");
    console.log("✅ feedback_messages table exists!");

    // Test 2: Try to insert a test record
    console.log("🧪 Testing data insertion...");
    const { data: insertData, error: insertError } = await supabase
      .from("feedback_messages")
      .insert([
        {
          name: "Test User",
          email: "test@example.com",
          feedback: "Database connection test",
          rating: 5,
          category: "general",
        },
      ])
      .select();

    if (insertError) {
      console.error("❌ Insert error:", insertError.message);
      console.log("🔧 Check your RLS policies and table permissions");
      return;
    }

    console.log("✅ Data insertion successful!");
    console.log("✅ Test record created:", insertData[0].id);

    // Test 3: Clean up test record
    console.log("🧹 Cleaning up test record...");
    const { error: deleteError } = await supabase
      .from("feedback_messages")
      .delete()
      .eq("id", insertData[0].id);

    if (deleteError) {
      console.error("⚠️ Cleanup error:", deleteError.message);
    } else {
      console.log("✅ Test record cleaned up!");
    }

    console.log("🎉 All database tests passed! Your feedback system is ready!");
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
}

// Run the test
testDatabaseConnection();
