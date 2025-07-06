"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Check, AlertCircle } from "lucide-react";

export default function TestNotificationsPage() {
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

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Authentication
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
          `User authenticated: ${authData.user?.email}`,
          authData.user
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

    // Test 2: Notifications endpoint
    addTestResult(
      "Notifications API",
      "running",
      "Testing notifications endpoint..."
    );
    try {
      const notificationsResponse = await fetch("/api/notifications");
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        addTestResult(
          "Notifications API",
          "success",
          `Endpoint working - Unread: ${
            notificationsData.unreadCount
          }, Total: ${notificationsData.notifications?.length || 0}`,
          notificationsData
        );
      } else {
        addTestResult(
          "Notifications API",
          "error",
          `Endpoint failed: ${notificationsResponse.status}`
        );
      }
    } catch (error) {
      addTestResult(
        "Notifications API",
        "error",
        `Test failed: ${error.message}`
      );
    }

    // Test 3: Admin notifications endpoint
    addTestResult(
      "Admin Notifications API",
      "running",
      "Testing admin notifications endpoint..."
    );
    try {
      const adminResponse = await fetch("/api/admin/notifications");
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        addTestResult(
          "Admin Notifications API",
          "success",
          `Admin endpoint working - Total notifications: ${
            adminData.notifications?.length || 0
          }`,
          adminData
        );
      } else {
        addTestResult(
          "Admin Notifications API",
          "error",
          `Admin endpoint failed: ${adminResponse.status}`
        );
      }
    } catch (error) {
      addTestResult(
        "Admin Notifications API",
        "error",
        `Test failed: ${error.message}`
      );
    }

    // Test 4: Users endpoint
    addTestResult("Users API", "running", "Testing users endpoint...");
    try {
      const usersResponse = await fetch("/api/admin/users");
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        addTestResult(
          "Users API",
          "success",
          `Users endpoint working - Total users: ${
            usersData.users?.length || 0
          }`,
          usersData
        );
      } else {
        addTestResult(
          "Users API",
          "error",
          `Users endpoint failed: ${usersResponse.status}`
        );
      }
    } catch (error) {
      addTestResult("Users API", "error", `Test failed: ${error.message}`);
    }

    // Test 5: Send test notification (if admin)
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
            title: "Test Notification",
            message: "This is a test notification from the test page!",
            type: "admin_message",
            isGlobal: true,
          }),
        });

        if (sendResponse.ok) {
          const sendData = await sendResponse.json();
          addTestResult(
            "Send Test Notification",
            "success",
            `Test notification sent successfully: ${sendData.message}`,
            sendData
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
              Notification System Test
            </h1>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={runTests}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {isRunning ? "Running Tests..." : "Run Tests"}
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
                Click "Run Tests" to start testing the notification system
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

          {testResults.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">Test Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Tests:
                  </span>
                  <span className="ml-2 font-medium">{testResults.length}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Passed:
                  </span>
                  <span className="ml-2 font-medium text-green-500">
                    {testResults.filter((r) => r.status === "success").length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Failed:
                  </span>
                  <span className="ml-2 font-medium text-red-500">
                    {testResults.filter((r) => r.status === "error").length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
