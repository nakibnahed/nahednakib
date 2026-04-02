"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import UserSidebar from "@/components/User/Sidebar/UserSidebar";
import styles from "./UserLayout.module.css";

export default function UserLayout({ user, profileData, children }) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

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
        <UserSidebar
          profileData={profileData}
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
          <span className={styles.brandMark}>Account</span>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
