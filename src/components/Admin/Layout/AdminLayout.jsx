"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import Sidebar from "@/components/Admin/Sidebar/Sidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error getting user:", error);
          setLoading(false);
          return;
        }

        if (user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single();

            if (profileError) {
              console.error("Error fetching profile:", profileError);
              setAdminData({ user, profile: null });
            } else {
              setAdminData({ user, profile });
            }
          } catch (profileError) {
            console.error("Error in profile fetch:", profileError);
            setAdminData({ user, profile: null });
          }
        } else {
          setAdminData(null);
        }
      } catch (error) {
        console.error("Error loading admin data:", error);
        setAdminData(null);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Sidebar adminData={adminData} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
