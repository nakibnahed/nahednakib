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
  Mail,
  Timer,
} from "lucide-react";

const NAV = [
  { key: "dashboard",        label: "Dashboard",          href: "/users/dashboard",                       icon: LayoutGrid },
  { key: "comments",         label: "My comments",        href: "/users/dashboard/comments",              icon: MessageCircle },
  { key: "likes",            label: "Liked posts",        href: "/users/dashboard/likes",                 icon: Heart },
  { key: "favorites",        label: "Favorites",          href: "/users/dashboard/favorites",             icon: Star },
  { key: "tracker",          label: "Learning tracker",   href: "/users/dashboard/tracker",               icon: Timer },
  { key: "meeting-requests", label: "Meeting requests",   href: "/conversation-practice?tab=requests",    icon: CalendarCheck2 },
  { key: "settings",         label: "Settings",           href: "/users/dashboard/settings",              icon: Settings },
  { key: "profile",          label: "Profile",            href: "/users/dashboard/profile",               icon: User },
];

export default function UserSidebar({ profileData, onNavigate, collapsed }) {
  const router = useRouter();
  const pathname = usePathname();

  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  const isActive = (href) => {
    if (href === "/users/dashboard") return normalizedPath === "/users/dashboard";
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
    <div className={`${styles.sidebarContainer} ${collapsed ? styles.collapsed : ""}`}>
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
                  data-label={item.label}
                >
                  <Link
                    href={item.href}
                    className={styles.menuLink}
                    onClick={() => onNavigate?.()}
                    title={collapsed ? item.label : undefined}
                    data-tooltip={item.label}
                  >
                    <span className={styles.menuItemContent}>
                      <Icon size={18} strokeWidth={2} />
                      <span className={styles.menuLabel}>{item.label}</span>
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
                title={collapsed ? "Log out" : undefined}
                data-tooltip="Log out"
              >
                <span className={styles.menuItemContent}>
                  <LogOut size={18} strokeWidth={2} />
                  <span className={styles.menuLabel}>Log out</span>
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div className={styles.userCard}>
          <Link
            href="/users/dashboard/profile"
            className={styles.userAvatarLink}
            title={collapsed ? displayName : undefined}
          >
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
            <Link href="/users/dashboard/profile" className={styles.userNameLink}>
              <span className={styles.userName}>{displayName}</span>
            </Link>
            <p className={styles.userRole}>
              <User size={12} style={{ color: "var(--primary-color)" }} />
              {roleLabel}
            </p>
          </div>
          <div className={styles.settingsFloating}>
            <Link
              href="/users/dashboard/profile"
              className={styles.settingsIcon}
              aria-label="Profile"
              onClick={() => onNavigate?.()}
            >
              <Settings size={16} />
            </Link>
            <span className={styles.tooltip}>Profile</span>
          </div>
        </div>

      </nav>
    </div>
  );
}
