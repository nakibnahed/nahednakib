"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import styles from "./UserSidebar.module.css";
import {
  User,
  Heart,
  MessageCircle,
  Edit,
  Star,
  LogOut,
  Settings,
  Activity,
} from "lucide-react";

export default function UserSidebar({ user, profileData }) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      path: "/users/profile",
      icon: <User size={18} />,
    },
    {
      label: "My Comments",
      path: "/users/profile/comments",
      icon: <MessageCircle size={18} />,
    },
    {
      label: "Liked Posts",
      path: "/users/profile/likes",
      icon: <Heart size={18} />,
    },
    {
      label: "Favorites",
      path: "/users/profile/favorites",
      icon: <Star size={18} />,
    },
    {
      label: "Edit Profile",
      path: "/users/profile/edit",
      icon: <Edit size={18} />,
    },
    {
      label: "Activity",
      path: "/users/profile/activity",
      icon: <Activity size={18} />,
    },
    {
      label: "Settings",
      path: "/users/profile/settings",
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
            <p className={styles.userEmail}>
              {profileData?.first_name || profileData?.last_name
                ? `${profileData?.first_name || ""} ${
                    profileData?.last_name || ""
                  }`.trim()
                : profileData?.full_name || "User"}
            </p>
          </div>
        </div>

        <h3 className={styles.panelTitle}>User Panel</h3>
        <ul className={styles.menu}>
          {navItems.map((item) => (
            <li
              key={item.path}
              className={`${styles.menuItem} ${
                pathname === item.path ? styles.active : ""
              }`}
              onClick={() => router.push(item.path)}
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
