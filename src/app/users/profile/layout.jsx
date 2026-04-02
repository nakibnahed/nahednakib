"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import UserLayout from "@/components/User/Layout/UserLayout";
import { ProfileShellProvider } from "@/components/User/Layout/ProfileShellContext";
import { useAuthSession } from "@/context/AuthSessionContext";
import styles from "@/components/User/Layout/UserLayout.module.css";

export default function ProfileSegmentLayout({ children }) {
  const { user, loading: authLoading, initialized } = useAuthSession();
  const [loading, setLoading] = useState(true);
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
    async function loadProfile() {
      try {
        setLoading(true);
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

    loadProfile();
    return () => {
      active = false;
    };
  }, [authLoading, initialized, router, user]);

  if (authLoading || !initialized || loading) {
    return (
      <div className={styles.shellLoading}>
        <p>Loading your profile…</p>
      </div>
    );
  }

  if (error || !user || !profileData) {
    return (
      <div className={styles.shellError}>
        <p>{error || "Could not load profile."}</p>
      </div>
    );
  }

  return (
    <ProfileShellProvider value={{ user, profileData }}>
      <UserLayout user={user} profileData={profileData}>
        {children}
      </UserLayout>
    </ProfileShellProvider>
  );
}
