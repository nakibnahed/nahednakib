"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import UserLayout from "@/components/User/Layout/UserLayout";
import { useAuthSession } from "@/context/AuthSessionContext";

export default function ProfilePage() {
  const { user, loading: authLoading, initialized } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    let active = true;
    async function loadUserData() {
      try {
        setLoading(true);

        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!active) return;

        if (profileError) {
          setError("Could not load profile data");
        } else {
          setProfileData(profile);
        }
      } catch {
        if (!active) return;
        setError("An error occurred while loading your profile");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUserData();
    return () => {
      active = false;
    };
  }, [authLoading, initialized, router, user]);

  if (authLoading || !initialized || loading) {
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
