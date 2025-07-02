"use client";

import { useRouter, usePathname } from "next/navigation";
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
} from "lucide-react";

export default function Sidebar() {
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
      // TODO: Create comments management page next
    },
  ];

  return (
    <div className={styles.sidebarContainer}>
      <nav className={styles.sidebar}>
        <h3>Admin Panel</h3>
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
          <li className={styles.menuItem}>
            <LogoutButton />
          </li>
        </ul>
      </nav>
    </div>
  );
}
