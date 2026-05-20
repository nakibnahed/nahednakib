"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronLeft } from "lucide-react";
import UserSidebar from "@/components/User/Sidebar/UserSidebar";
import styles from "./UserLayout.module.css";

export default function UserLayout({ user, profileData, children }) {
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("user_sidebar_collapsed") === "true";
  });

  function toggleCollapse() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("user_sidebar_collapsed", String(next));
      return next;
    });
  }

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <div className={`${styles.shell} ${sidebarCollapsed ? styles.shellCollapsed : ""}`}>
      {navOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      {/* Desktop-only collapse toggle — lives outside the sidebar so it's never clipped */}
      <button
        type="button"
        className={styles.sidebarToggle}
        onClick={toggleCollapse}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft size={15} strokeWidth={2.5} className={sidebarCollapsed ? styles.toggleFlipped : ""} />
      </button>

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
        <UserSidebar
          profileData={profileData}
          onNavigate={() => setNavOpen(false)}
          collapsed={sidebarCollapsed}
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
          <span className={styles.brandMark}>Account</span>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
