"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";
import Logo from "@/elements/Logo/Logo";
import DarkMoodToggle from "../DarkMoodToggle/DarkMoodToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { User, Menu, X, Info, Briefcase, Mail } from "lucide-react";

// Example links data with icons
const navLinks = [
  { id: 1, url: "/about", title: "About", icon: <Info size={20} /> },
  {
    id: 2,
    url: "/portfolio",
    title: "Portfolio",
    icon: <Briefcase size={20} />,
  },
  { id: 3, url: "/contact", title: "Contact", icon: <Mail size={20} /> },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <div className={styles.container}>
      <Logo />

      {/* Desktop right links */}
      <div className={styles.desktopRight}>
        {navLinks.map((link) => (
          <Link key={link.id} href={link.url} className={styles.link}>
            {link.title}
          </Link>
        ))}
        {/* Dashboard icon only */}
        {user && (
          <Link
            href="/admin/"
            className={styles.dashboardIconOnly}
            aria-label="Dashboard"
          >
            <User size={26} strokeWidth={3} />
          </Link>
        )}
        <DarkMoodToggle />
      </div>

      {/* Mobile right: dashboard icon + burger */}
      <div className={styles.mobileRight}>
        {user && (
          <Link
            href="/admin/"
            className={styles.userMobileIcon}
            aria-label="Dashboard"
          >
            <User size={26} strokeWidth={3} />
          </Link>
        )}
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
        {navLinks.map((link) => (
          <Link
            key={link.id}
            href={link.url}
            className={styles.mobileMenuLink}
            onClick={() => setMenuOpen(false)}
          >
            <span className={styles.mobileMenuIcon}>{link.icon}</span>
            <span>{link.title}</span>
          </Link>
        ))}
        {user && (
          <Link
            href="/admin/"
            className={styles.mobileMenuLink}
            onClick={() => setMenuOpen(false)}
          >
            <span className={styles.mobileMenuIcon}>
              <User size={20} strokeWidth={3} />
            </span>
            <span>Dashboard</span>
          </Link>
        )}
        <div className={styles.mobileMenuDarkToggle}>
          <DarkMoodToggle />
        </div>
      </div>
    </div>
  );
}
