"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Check, AlertCircle } from "lucide-react";

export default function TestRealtimePage() {
  const [user, setUser] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [realTimeStatus, setRealTimeStatus] = useState("Not connected");

  useEffect(() => {
    // Check if user is authenticated
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch((error) => {
        console.error("Auth check failed:", error);
      });
  }, []);

  const addTestResult = (test, status, message, data = null) => {
    setTestResults((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        test,
        status,
        message,
        data,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const testRealtimeConnection = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Check Supabase connection
    addTestResult(
      "Supabase Connection",
      "running",
      "Testing Supabase connection..."
    );
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addTestResult(
          "Supabase Connection",
          "error",
          `Connection failed: ${error.message}`
        );
        setIsRunning(false);
        return;
      }

      if (!data.session) {
        addTestResult(
          "Supabase Connection",
          "error",
          "No active session found"
        );
        setIsRunning(false);
        return;
      }

      addTestResult(
        "Supabase Connection",
        "success",
        `Connected as: ${data.session.user.email}`
      );
    } catch (error) {
      addTestResult(
        "Supabase Connection",
        "error",
        `Connection failed: ${error.message}`
      );
      setIsRunning(false);
      return;
    }

    // Test 2: Test real-time subscription
    addTestResult(
      "Real-time Subscription",
      "running",
      "Setting up real-time subscription..."
    );
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        addTestResult(
          "Real-time Subscription",
          "error",
          "No user session for subscription"
        );
        setIsRunning(false);
        return;
      }

      // Create a test subscription
      const subscription = supabase
        .channel(`test-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("🎉 Test notification received:", payload);
            setRealTimeStatus("✅ Real-time working! Notification received");
            addTestResult(
              "Real-time Test",
              "success",
              "Real-time notification received!",
              payload
            );
          }
        )
        .subscribe((status) => {
          console.log("Test subscription status:", status);
          if (status === "SUBSCRIBED") {
            setRealTimeStatus("✅ Connected and listening");
            addTestResult(
              "Real-time Subscription",
              "success",
              "Subscription active and listening"
            );
          } else if (status === "CHANNEL_ERROR") {
            setRealTimeStatus("❌ Connection error");
            addTestResult(
              "Real-time Subscription",
              "error",
              "Subscription failed to connect"
            );
          }
        });

      // Clean up subscription after 10 seconds
      setTimeout(() => {
        supabase.removeChannel(subscription);
        setRealTimeStatus("Disconnected");
      }, 10000);
    } catch (error) {
      addTestResult(
        "Real-time Subscription",
        "error",
        `Subscription failed: ${error.message}`
      );
    }

    // Test 3: Send test notification (if admin)
    if (user?.email === "nahednakibyos@gmail.com") {
      addTestResult(
        "Send Test Notification",
        "running",
        "Sending test notification..."
      );
      try {
        const sendResponse = await fetch("/api/admin/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Real-time Test",
            message:
              "This is a test notification to verify real-time functionality!",
            type: "admin_message",
            isGlobal: false,
            recipientIds: [user.id], // Send to self
          }),
        });

        if (sendResponse.ok) {
          const sendData = await sendResponse.json();
          addTestResult(
            "Send Test Notification",
            "success",
            "Test notification sent successfully"
          );
        } else {
          const errorData = await sendResponse.json();
          addTestResult(
            "Send Test Notification",
            "error",
            `Failed to send: ${errorData.error}`
          );
        }
      } catch (error) {
        addTestResult(
          "Send Test Notification",
          "error",
          `Send failed: ${error.message}`
        );
      }
    } else {
      addTestResult(
        "Send Test Notification",
        "skipped",
        "Not admin user, skipping send test"
      );
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <Check className="text-green-500" size={16} />;
      case "error":
        return <AlertCircle className="text-red-500" size={16} />;
      case "running":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        );
      case "skipped":
        return <div className="text-gray-400">-</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="text-blue-500" size={24} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Real-time Notification Test
            </h1>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={testRealtimeConnection}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {isRunning ? "Testing..." : "Test Real-time"}
              </button>
              {user && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Logged in as: {user.email}
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Real-time Status: {realTimeStatus}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Click "Test Real-time" to start testing the real-time
                notification system
              </div>
            ) : (
              testResults.map((result) => (
                <div
                  key={result.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(result.status)}
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {result.test}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {result.timestamp}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 ml-7">
                    {result.message}
                  </p>
                  {result.data && (
                    <details className="ml-7 mt-2">
                      <summary className="text-sm text-blue-500 cursor-pointer">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How to Test Real-time Notifications:
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
              <li>1. Run the test above to verify connection</li>
              <li>2. Open another browser tab/window</li>
              <li>3. Go to admin notifications and send a notification</li>
              <li>4. Watch for real-time updates in this tab</li>
              <li>5. Check the browser console for detailed logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
