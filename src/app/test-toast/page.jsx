"use client";

import { useState } from "react";

export default function TestToastPage() {
  const [count, setCount] = useState(0);

  const showToast = (type) => {
    if (typeof window !== "undefined" && window.showToast) {
      const messages = {
        success: "This is a success message!",
        error: "This is an error message!",
        info: "This is an info message!",
        warning: "This is a warning message!",
      };

      window.showToast(messages[type], type);
      setCount((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Toast Notification Test
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click the buttons below to test different types of toast
            notifications. They will appear at the top right of the page.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => showToast("success")}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Success Toast
            </button>

            <button
              onClick={() => showToast("error")}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Error Toast
            </button>

            <button
              onClick={() => showToast("info")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Info Toast
            </button>

            <button
              onClick={() => showToast("warning")}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Warning Toast
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toasts shown: {count}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
