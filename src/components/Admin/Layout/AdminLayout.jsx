"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import Sidebar from "@/components/Admin/Sidebar/Sidebar";
import { Menu, X } from "lucide-react";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

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

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingPulse} aria-hidden />
        <p>Loading admin panel…</p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      {navOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside
        className={`${styles.sidebarWrap} ${navOpen ? styles.sidebarOpen : ""}`}
      >
        <button
          type="button"
          className={styles.drawerClose}
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        >
          <X size={20} strokeWidth={2} />
        </button>
        <Sidebar
          adminData={adminData}
          onNavigate={() => setNavOpen(false)}
        />
      </aside>
      <div className={styles.mainColumn}>
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.menuToggle}
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <span className={styles.brandMark}>Console</span>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
