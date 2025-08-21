"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import styles from "./UserSidebar.module.css";
import {
  User,
  MessageCircle,
  Heart,
  Star,
  Settings,
  LogOut,
} from "lucide-react";

export default function UserSidebar({
  user,
  profileData,
  activeTab,
  setActiveTab,
}) {
  const router = useRouter();

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <User size={18} />,
    },
    {
      key: "comments",
      label: "My Comments",
      icon: <MessageCircle size={18} />,
    },
    {
      key: "likes",
      label: "Liked Posts",
      icon: <Heart size={18} />,
    },
    {
      key: "favorites",
      label: "Favorites",
      icon: <Star size={18} />,
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className={styles.sidebarContainer}>
      <nav className={styles.sidebar}>
        <div className={styles.userInfo}>
          <img
            src={profileData?.avatar_url || "/default-avatar.svg"}
            alt="User Avatar"
            className={styles.avatar}
          />
          <div className={styles.userDetails}>
            <h4 className={styles.userName}>
              {profileData?.first_name || profileData?.last_name
                ? `${profileData?.first_name || ""} ${
                    profileData?.last_name || ""
                  }`.trim()
                : profileData?.full_name || "User"}
            </h4>
            <p className={styles.userRole}>
              {profileData?.professional_role ||
                (profileData?.role === "admin" ? "Administrator" : "User")}
            </p>
          </div>
        </div>

        <h3 className={styles.panelTitle}>User Panel</h3>
        <ul className={styles.menu}>
          {navItems.map((item) => (
            <li
              key={item.key}
              className={`${styles.menuItem} ${
                activeTab === item.key ? styles.active : ""
              }`}
              onClick={() => setActiveTab(item.key)}
            >
              <span className={styles.menuItemContent}>
                {item.icon}
                {item.label}
              </span>
            </li>
          ))}
          <li className={styles.menuItem} onClick={handleLogout}>
            <span className={styles.menuItemContent}>
              <LogOut size={18} />
              Logout
            </span>
          </li>
        </ul>
      </nav>
    </div>
  );
}
