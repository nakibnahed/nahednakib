"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";
import Logo from "@/elements/Logo/Logo";
import DarkMoodToggle from "../DarkMoodToggle/DarkMoodToggle";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Menu,
  X,
  Info,
  Briefcase,
  FileText,
  Mail,
  Activity,
} from "lucide-react";
import { useRouter } from "next/navigation";
import NotificationIcon from "../NotificationIcon/NotificationIcon";

const navLinks = [
  { id: 1, url: "/info", title: "Running", icon: Activity },
  { id: 2, url: "/portfolio", title: "Portfolio", icon: Briefcase },
  { id: 3, url: "/blog", title: "Blog", icon: FileText },
  { id: 4, url: "/about", title: "About", icon: Info },
  { id: 5, url: "/contact", title: "Contact", icon: Mail },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          setError(error.message);
          setUser(null);
          setUserRole(null);
        } else {
          setUser(session?.user || null);

          // Simple admin check
          if (session?.user) {
            const adminEmails = [
              "admin@example.com",
              "nahednakibyos@gmail.com",
            ];
            if (adminEmails.includes(session.user.email)) {
              setUserRole("admin");
            } else {
              setUserRole("user");
            }
          } else {
            setUserRole(null);
          }
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        setError(error.message);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const adminEmails = ["admin@example.com", "nahednakibyos@gmail.com"];
          if (adminEmails.includes(session.user.email)) {
            setUserRole("admin");
          } else {
            setUserRole("user");
          }
        } else {
          setUserRole(null);
        }
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const toggleMenu = () => setMenuOpen((open) => !open);

  // Simple user icon click handler
  const handleUserIconClick = async (e) => {
    e.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    // Navigate based on role
    if (userRole === "admin") {
      router.push("/admin/");
    } else {
      router.push("/users/profile");
    }
  };

  return (
    <div className={styles.navbarFixedBg}>
      <div className={styles.container}>
        <Logo />

        {/* Centered menu links */}
        <nav className={styles.centerNav}>
          <div className={styles.linksWrapper}>
            {navLinks.map((link) => (
              <Link key={link.id} href={link.url} className={styles.link}>
                {link.title}
              </Link>
            ))}
          </div>
        </nav>

        {/* Right section: Notifications, User, Dark mode */}
        <div className={styles.rightSection}>
          {user && <NotificationIcon />}
          <button
            className={styles.dashboardIconOnly}
            aria-label="User"
            onClick={handleUserIconClick}
            type="button"
          >
            <User size={26} strokeWidth={3} />
          </button>
          <DarkMoodToggle />
        </div>

        {/* Mobile right: notifications, user icon, burger */}
        <div className={styles.mobileRight}>
          {user && <NotificationIcon />}
          <button
            className={styles.userMobileIcon}
            aria-label="User"
            onClick={handleUserIconClick}
            type="button"
          >
            <User size={26} strokeWidth={3} />
          </button>
          <button
            className={styles.menuIcon}
            onClick={toggleMenu}
            aria-label="Open menu"
            type="button"
          >
            {menuOpen ? (
              <X size={26} strokeWidth={3} />
            ) : (
              <Menu size={26} strokeWidth={3} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`${styles.mobileMenu} ${
            menuOpen ? styles.mobileMenuOpen : ""
          }`}
        >
          {/* Menu Header */}
          <div className={styles.mobileMenuHeader}>
            <button
              className={styles.profileButton}
              onClick={async (e) => {
                await handleUserIconClick(e);
                setMenuOpen(false);
              }}
              type="button"
            >
              <User size={20} />
              <span>Profile</span>
            </button>

            <div className={styles.mobileMenuHeaderRight}>
              <DarkMoodToggle />
              <button
                className={styles.closeMenu}
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Menu Links */}
          <div className={styles.MenuLinks}>
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.id}
                  href={link.url}
                  className={styles.mobileMenuLink}
                  onClick={() => setMenuOpen(false)}
                >
                  <IconComponent size={20} />
                  <span>{link.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
