"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/services/supabaseClient";
import styles from "./UserSidebar.module.css";
import {
  User,
  MessageCircle,
  CalendarCheck2,
  Heart,
  Star,
  Settings,
  LogOut,
  LayoutGrid,
} from "lucide-react";

const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/users/profile",
    icon: LayoutGrid,
  },
  {
    key: "comments",
    label: "My comments",
    href: "/users/profile/comments",
    icon: MessageCircle,
  },
  {
    key: "likes",
    label: "Liked posts",
    href: "/users/profile/likes",
    icon: Heart,
  },
  {
    key: "favorites",
    label: "Favorites",
    href: "/users/profile/favorites",
    icon: Star,
  },
  {
    key: "meeting-requests",
    label: "Meeting requests",
    href: "/conversation-practice?tab=requests",
    icon: CalendarCheck2,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/users/profile/settings",
    icon: Settings,
  },
];

export default function UserSidebar({ profileData, onNavigate }) {
  const router = useRouter();
  const pathname = usePathname();

  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  const isActive = (href) => {
    if (href === "/users/profile") {
      return normalizedPath === "/users/profile";
    }
    return normalizedPath === href || normalizedPath.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    onNavigate?.();
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName =
    profileData?.first_name || profileData?.last_name
      ? `${profileData?.first_name || ""} ${profileData?.last_name || ""}`.trim()
      : profileData?.full_name || "User";

  const roleLabel =
    profileData?.professional_role ||
    (profileData?.role === "admin" ? "Administrator" : "Member");

  return (
    <div className={styles.sidebarContainer}>
      <nav className={styles.sidebar} aria-label="Account navigation">
        <div className={styles.brandRow}>
          <span className={styles.brandIcon} aria-hidden>
            <User size={20} strokeWidth={2} />
          </span>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Account</span>
            <span className={styles.brandSub}>Your profile</span>
          </div>
        </div>

        <div className={styles.navScroll}>
          <p className={styles.sectionLabel}>Navigation</p>
          <ul className={styles.menu}>
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li
                  key={item.key}
                  className={`${styles.menuItem} ${active ? styles.active : ""}`}
                >
                  <Link
                    href={item.href}
                    className={styles.menuLink}
                    onClick={() => onNavigate?.()}
                  >
                    <span className={styles.menuItemContent}>
                      <Icon size={18} strokeWidth={2} />
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
            <li className={`${styles.menuItem} ${styles.logoutItem}`}>
              <button
                type="button"
                className={styles.menuLink}
                onClick={handleLogout}
              >
                <span className={styles.menuItemContent}>
                  <LogOut size={18} strokeWidth={2} />
                  Log out
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div className={styles.userCard}>
          <Link href="/users/profile/settings" className={styles.userAvatarLink}>
            <div className={styles.userAvatar}>
              <Image
                src={profileData?.avatar_url || "/default-avatar.svg"}
                alt=""
                className={styles.avatarImage}
                width={48}
                height={48}
              />
            </div>
          </Link>
          <div className={styles.userDetails}>
            <Link href="/users/profile/settings" className={styles.userNameLink}>
              <span className={styles.userName}>{displayName}</span>
            </Link>
            <p className={styles.userRole}>
              <User size={12} style={{ color: "var(--primary-color)" }} />
              {roleLabel}
            </p>
          </div>
          <div className={styles.settingsFloating}>
            <Link
              href="/users/profile/settings"
              className={styles.settingsIcon}
              aria-label="Settings"
              onClick={() => onNavigate?.()}
            >
              <Settings size={16} />
            </Link>
            <span className={styles.tooltip}>Settings</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
