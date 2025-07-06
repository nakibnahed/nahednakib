"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import LogoutButton from "@/components/Admin/LogoutButton/LogoutButton";
import styles from "./Sidebar.module.css";
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  Mail,
  Users,
  MessageCircle,
  Send,
  Shield,
  Crown,
} from "lucide-react";

export default function Sidebar({ adminData }) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
    { label: "Users", path: "/admin/users", icon: <Users size={18} /> },
    {
      label: "Portfolios",
      path: "/admin/portfolio",
      icon: <Briefcase size={18} />,
    },
    { label: "Blogs", path: "/admin/blogs", icon: <BookOpen size={18} /> },
    { label: "Forms", path: "/admin/contact", icon: <Mail size={18} /> },
    {
      label: "Newsletter",
      path: "/admin/newsletter",
      icon: <Send size={18} />,
    },
    {
      label: "Comments",
      path: "/admin/comments",
      icon: <MessageCircle size={18} />,
    },
  ];

  // Get admin display name
  const getAdminDisplayName = () => {
    if (!adminData?.profile) return "Admin";

    if (adminData.profile.first_name || adminData.profile.last_name) {
      const firstName = adminData.profile.first_name || "";
      const lastName = adminData.profile.last_name || "";
      return `${firstName} ${lastName}`.trim();
    }
    return adminData.profile.full_name || "Admin";
  };

  // Get admin avatar
  const getAdminAvatar = () => {
    if (adminData?.profile?.avatar_url) {
      return adminData.profile.avatar_url;
    }
    return "/default-avatar.svg"; // fallback
  };

  return (
    <div className={styles.sidebarContainer}>
      <nav className={styles.sidebar}>
        {/* Admin Profile Section */}
        <div className={styles.adminInfo}>
          <div className={styles.adminAvatar}>
            <img
              src={getAdminAvatar()}
              alt="Admin Avatar"
              className={styles.avatarImage}
            />
          </div>
          <div className={styles.adminDetails}>
            <h4 className={styles.adminName}>{getAdminDisplayName()}</h4>
            <p className={styles.adminRole}>
              <Shield size={12} style={{ color: "var(--primary-color)" }} />
              Administrator
            </p>
          </div>
        </div>

        <h3 className={styles.panelTitle}>Admin Panel</h3>
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
          <li className={`${styles.menuItem} ${styles.logoutItem}`}>
            <LogoutButton />
          </li>
        </ul>
      </nav>
    </div>
  );
}
