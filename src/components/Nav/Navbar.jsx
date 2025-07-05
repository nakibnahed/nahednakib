"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";
import Logo from "@/elements/Logo/Logo";
import DarkMoodToggle from "../DarkMoodToggle/DarkMoodToggle";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Menu, X } from "lucide-react";
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

        {/* Right section: Dark mode, User */}
        <div className={styles.rightSection}>
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

        {/* Mobile right: user icon, burger */}
        <div className={styles.mobileRight}>
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
