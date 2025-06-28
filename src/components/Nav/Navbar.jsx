"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";
import Logo from "@/elements/Logo/Logo";
import DarkMoodToggle from "../DarkMoodToggle/DarkMoodToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { User, Menu, X, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

const navLinks = [
  { id: 1, url: "/about", title: "About" },
  { id: 2, url: "/portfolio", title: "Portfolio" },
  { id: 3, url: "/blog", title: "Blog" },
  { id: 4, url: "/contact", title: "Contact" },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Fetch user role if logged in
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setUserRole(profile?.role || "user");
      } else {
        setUserRole(null);
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then(({ data: profile }) => {
              setUserRole(profile?.role || "user");
            });
        } else {
          setUserRole(null);
        }
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const toggleMenu = () => setMenuOpen((open) => !open);

  // Improved: Always fetch latest session and role on icon click
  const handleUserIconClick = async (e) => {
    e.preventDefault();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role === "admin") {
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

        {/* Right section: Dark mode, Notification, User */}
        <div className={styles.rightSection}>
          <button
            type="button"
            aria-label="Notifications"
            className={styles.notificationBtn}
          >
            <Bell size={24} strokeWidth={2.2} />
          </button>
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

        {/* Mobile right: notification, user icon, burger */}
        <div className={styles.mobileRight}>
          <button
            type="button"
            aria-label="Notifications"
            className={styles.notificationBtn}
          >
            <Bell size={24} strokeWidth={2.2} />
          </button>
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
          <button
            className={styles.closeMenu}
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            <X size={32} />
          </button>
          <div className={styles.MenuLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.url}
                className={styles.mobileMenuLink}
                onClick={() => setMenuOpen(false)}
              >
                {link.title}
              </Link>
            ))}
            <button
              className={styles.mobileMenuLink}
              onClick={async (e) => {
                await handleUserIconClick(e);
                setMenuOpen(false);
              }}
              type="button"
            >
              <span>User</span>
            </button>
          </div>
          <div className={styles.mobileMenuDarkToggle}>
            <DarkMoodToggle />
            <span className={styles.mobileMenuLink}></span>
          </div>
        </div>
      </div>
    </div>
  );
}
