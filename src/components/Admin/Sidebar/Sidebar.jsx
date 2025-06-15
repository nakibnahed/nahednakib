"use client";

import { useRouter, usePathname } from "next/navigation";
import LogoutButton from "@/components/Admin/LogoutButton/LogoutButton";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", path: "/admin" },
    { label: "Portfolios", path: "/admin/portfolio" },
    { label: "Blogs", path: "/admin/blogs" },
    { label: "Contact", path: "/admin/contact" },
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
              {item.label}
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
