"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Bell,
  Tag,
  User,
  Settings,
  MessageSquare,
  PenLine,
  Sparkles,
} from "lucide-react";

export default function Sidebar({ adminData, onNavigate }) {
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
    { label: "Categories", path: "/admin/categories", icon: <Tag size={18} /> },
    { label: "Authors", path: "/admin/authors", icon: <PenLine size={18} /> },
    { label: "Forms", path: "/admin/contact", icon: <Mail size={18} /> },
    {
      label: "Feedback",
      path: "/admin/feedback",
      icon: <MessageSquare size={18} />,
    },
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
    {
      label: "Notifications",
      path: "/admin/notifications",
      icon: <Bell size={18} />,
    },
    {
      label: "Settings",
      path: "/admin/running-settings",
      icon: <Settings size={18} />,
    },
  ];

  const go = (path) => {
    onNavigate?.();
    router.push(path);
  };

  const getAdminDisplayName = () => {
    if (!adminData?.profile) return "Admin";

    if (adminData.profile.first_name || adminData.profile.last_name) {
      const firstName = adminData.profile.first_name || "";
      const lastName = adminData.profile.last_name || "";
      return `${firstName} ${lastName}`.trim();
    }
    return adminData.profile.full_name || "Admin";
  };

  const getAdminAvatar = () => {
    if (adminData?.profile?.avatar_url) {
      return adminData.profile.avatar_url;
    }
    return "/default-avatar.svg";
  };

  const getAdminRole = () => {
    if (adminData?.profile?.role === "admin") {
      return "Administrator";
    }
    if (adminData?.profile?.role === "user") {
      return "User";
    }
    return "Admin";
  };

  return (
    <div className={styles.sidebarContainer}>
      <nav className={styles.sidebar} aria-label="Admin navigation">
        <div className={styles.brandRow}>
          <span className={styles.brandIcon} aria-hidden>
            <Sparkles size={20} strokeWidth={2} />
          </span>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Admin</span>
            <span className={styles.brandSub}>Control center</span>
          </div>
        </div>

        <div className={styles.navScroll}>
          <p className={styles.sectionLabel}>Navigation</p>
          <ul className={styles.menu}>
            {navItems.map((item) => (
              <li
                key={item.path}
                className={`${styles.menuItem} ${
                  pathname === item.path ? styles.active : ""
                }`}
              >
                <button
                  type="button"
                  className={styles.menuButton}
                  onClick={() => go(item.path)}
                >
                  <span className={styles.menuItemContent}>
                    {item.icon}
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
            <li className={`${styles.menuItem} ${styles.logoutItem}`}>
              <LogoutButton />
            </li>
          </ul>
        </div>

        <div className={styles.adminInfo}>
          <Link href="/users/profile" className={styles.adminAvatarLink}>
            <div className={styles.adminAvatar}>
              <Image
                src={getAdminAvatar()}
                alt=""
                className={styles.avatarImage}
                width={48}
                height={48}
              />
            </div>
          </Link>
          <div className={styles.adminDetails}>
            <Link href="/users/profile" className={styles.adminNameLink}>
              <span className={styles.adminName}>{getAdminDisplayName()}</span>
            </Link>
            <p className={styles.adminRole}>
              <User size={12} style={{ color: "var(--primary-color)" }} />
              {getAdminRole()}
            </p>
          </div>
          <div className={styles.settingsFloating}>
            <Link href="/users/profile" className={styles.settingsIcon}>
              <Settings size={16} />
            </Link>
            <div className={styles.tooltip}>Edit profile</div>
          </div>
        </div>
      </nav>
    </div>
  );
}
