"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import UserLayout from "@/components/User/Layout/UserLayout";
import UserDashboard from "@/components/User/Dashboard/UserDashboard";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);

        // Get current user with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        let currentUser = null;

        while (retryCount < maxRetries) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            console.error("User error:", userError);
            retryCount++;

            if (retryCount < maxRetries) {
              console.log(
                `Retrying auth check (${retryCount}/${maxRetries})...`
              );
              // Try to refresh session
              const { error: refreshError } =
                await supabase.auth.refreshSession();
              if (refreshError) {
                console.error("Refresh error:", refreshError);
              }
              await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
              continue;
            } else {
              router.push("/login");
              return;
            }
          }

          if (!user) {
            router.push("/login");
            return;
          }

          currentUser = user;
          setUser(currentUser);
          break;
        }

        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setError("Could not load profile data");
        } else {
          setProfileData(profile);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("An error occurred while loading your profile");
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "#fff",
        }}
      >
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "#ff6b6b",
        }}
      >
        <p>{error}</p>
      </div>
    );
  }

  return <UserLayout user={user} profileData={profileData} />;
}
