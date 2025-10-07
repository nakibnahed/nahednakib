// =====================================================
// FEEDBACK SYSTEM TEST SCRIPT
// =====================================================
// Run this to test your feedback system after database setup

const testFeedback = {
  name: "Test User",
  email: "test@example.com",
  feedback:
    "This is a test feedback message to verify the system is working correctly.",
  rating: 5,
  category: "general",
};

async function testFeedbackSubmission() {
  try {
    console.log("🧪 Testing Feedback System...");
    console.log("📤 Submitting test feedback:", testFeedback);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testFeedback),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Success! Feedback submitted:", data.message);
      console.log("🎉 Your feedback system is working perfectly!");
    } else {
      console.error("❌ Error:", data.error);
      console.log("🔧 Please check your database setup and API configuration");
    }
  } catch (error) {
    console.error("❌ Network Error:", error.message);
    console.log("🔧 Please make sure your app is running");
  }
}

// Uncomment the line below to run the test:
// testFeedbackSubmission();

console.log("📋 To test your feedback system:");
console.log(
  "1. Make sure your database is set up using feedback_database_setup.sql"
);
console.log("2. Start your Next.js app: npm run dev");
console.log("3. Open browser console and run: testFeedbackSubmission()");
console.log("4. Or visit /feedback page and submit a real feedback");
