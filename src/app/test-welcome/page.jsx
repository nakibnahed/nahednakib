"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Check, AlertCircle } from "lucide-react";

export default function TestWelcomePage() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState(null);

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

  const testWelcomeNotification = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Check authentication
    addTestResult(
      "Authentication",
      "running",
      "Checking user authentication..."
    );
    try {
      const authResponse = await fetch("/api/profile");
      if (authResponse.ok) {
        const authData = await authResponse.json();
        addTestResult(
          "Authentication",
          "success",
          `User authenticated: ${authData.user?.email}`
        );
      } else {
        addTestResult("Authentication", "error", "User not authenticated");
        setIsRunning(false);
        return;
      }
    } catch (error) {
      addTestResult(
        "Authentication",
        "error",
        `Auth check failed: ${error.message}`
      );
      setIsRunning(false);
      return;
    }

    // Test 2: Send welcome notification
    addTestResult(
      "Welcome Notification",
      "running",
      "Sending welcome notification..."
    );
    try {
      const welcomeResponse = await fetch("/api/notifications/send-welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (welcomeResponse.ok) {
        const welcomeData = await welcomeResponse.json();
        addTestResult(
          "Welcome Notification",
          "success",
          welcomeData.message,
          welcomeData
        );
      } else {
        const errorData = await welcomeResponse.json();
        addTestResult(
          "Welcome Notification",
          "error",
          `Failed: ${errorData.error}`
        );
      }
    } catch (error) {
      addTestResult(
        "Welcome Notification",
        "error",
        `Request failed: ${error.message}`
      );
    }

    // Test 3: Check notifications
    addTestResult(
      "Check Notifications",
      "running",
      "Checking recent notifications..."
    );
    try {
      const notificationsResponse = await fetch("/api/notifications?limit=5");
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        const recentNotifications = notificationsData.notifications || [];
        const welcomeNotifications = recentNotifications.filter(
          (n) => n.title.includes("Welcome") || n.type === "user_login"
        );

        addTestResult(
          "Check Notifications",
          "success",
          `Found ${welcomeNotifications.length} recent welcome/login notifications`,
          welcomeNotifications
        );
      } else {
        addTestResult(
          "Check Notifications",
          "error",
          "Failed to fetch notifications"
        );
      }
    } catch (error) {
      addTestResult(
        "Check Notifications",
        "error",
        `Request failed: ${error.message}`
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
              Welcome Notification Test
            </h1>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={testWelcomeNotification}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {isRunning ? "Testing..." : "Test Welcome Notification"}
              </button>
              {user && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Logged in as: {user.email}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Click "Test Welcome Notification" to test the welcome
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

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              How to Test Welcome Notifications:
            </h3>
            <ol className="text-sm text-green-800 dark:text-green-200 space-y-1 ml-4">
              <li>1. Run the test above to verify the API works</li>
              <li>2. Log out and log back in to test the full flow</li>
              <li>3. Check your notification icon for the welcome message</li>
              <li>4. Try with both admin and regular user accounts</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
