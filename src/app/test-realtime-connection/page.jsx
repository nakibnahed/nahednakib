"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestRealtimeConnection() {
  const [status, setStatus] = useState("Initializing...");
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);

  const addLog = (message) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  useEffect(() => {
    const testConnection = async () => {
      try {
        addLog("Starting real-time connection test...");

        const supabase = createClient();

        // Test authentication
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        if (authError) {
          addLog(`❌ Auth error: ${authError.message}`);
          setStatus("Authentication failed");
          return;
        }

        if (!session?.user) {
          addLog("❌ No user session found");
          setStatus("No user session");
          return;
        }

        setUser(session.user);
        addLog(`✅ User authenticated: ${session.user.email}`);

        // Test basic connection
        addLog("Testing basic Supabase connection...");
        const { data: testData, error: testError } = await supabase
          .from("notifications")
          .select("count")
          .limit(1);

        if (testError) {
          addLog(`❌ Database connection error: ${testError.message}`);
          setStatus("Database connection failed");
          return;
        }

        addLog("✅ Database connection successful");

        // Test real-time subscription
        addLog("Setting up real-time subscription...");

        const channel = supabase
          .channel(`test-connection-${Date.now()}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${session.user.id}`,
            },
            (payload) => {
              addLog(
                `🎉 Real-time notification received: ${payload.new.title}`
              );
            }
          )
          .subscribe((subscriptionStatus) => {
            addLog(`🔌 Subscription status: ${subscriptionStatus}`);
            setStatus(`Real-time: ${subscriptionStatus}`);

            if (subscriptionStatus === "SUBSCRIBED") {
              addLog("✅ Real-time subscription successful!");
            } else if (subscriptionStatus === "CHANNEL_ERROR") {
              addLog("❌ Real-time channel error");
            } else if (subscriptionStatus === "CLOSED") {
              addLog("❌ Real-time connection closed");
            }
          });

        // Cleanup function
        return () => {
          addLog("🧹 Cleaning up test subscription");
          supabase.removeChannel(channel);
        };
      } catch (error) {
        addLog(`❌ Unexpected error: ${error.message}`);
        setStatus("Test failed");
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Real-time Connection Test</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Status: {status}</h2>
        {user && (
          <p>
            <strong>User:</strong> {user.email} ({user.id})
          </p>
        )}
      </div>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "15px",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "14px",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        <h3>Connection Logs:</h3>
        {logs.map((log, index) => (
          <div key={index} style={{ marginBottom: "5px" }}>
            {log}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Environment Check:</h3>
        <ul>
          <li>
            SUPABASE_URL:{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
          </li>
          <li>
            SUPABASE_ANON_KEY:{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? "✅ Set"
              : "❌ Missing"}
          </li>
        </ul>
      </div>
    </div>
  );
}
