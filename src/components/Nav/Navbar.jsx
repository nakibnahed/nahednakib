"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";
import { links } from "./data";
import Logo from "@/elements/Logo/Logo";
import DarkMoodToggle from "../DarkMoodToggle/DarkMoodToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { User, Menu, X } from "lucide-react";

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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={styles.container}>
      <Logo />

      <div className={styles.menuIcon} onClick={toggleMenu}>
        {menuOpen ? <X size={26} /> : <Menu size={26} />}
      </div>

      <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ""}`}>
        {/* Close icon for mobile menu */}
        {menuOpen && (
          <button
            className={styles.closeMenu}
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            <X size={32} />
          </button>
        )}

        {links.map((link) => (
          <Link
            key={link.id}
            href={link.url}
            className={styles.link}
            onClick={() => setMenuOpen(false)}
          >
            {link.title}
          </Link>
        ))}

        {/* Always render a placeholder for the dashboard icon */}
        {user ? (
          <Link
            href="/admin/"
            className={`${styles.link} ${styles.tooltip}`}
            onClick={() => setMenuOpen(false)}
          >
            <User size={22} strokeWidth="3" />
            <span className={styles.tooltipText}>Dashboard</span>
          </Link>
        ) : (
          // Placeholder: same width/height as the icon/link
          <span
            style={{
              display: "inline-block",
              width: 38,
              height: 22,
              marginLeft: "20px",
            }}
            aria-hidden="true"
          />
        )}

        <DarkMoodToggle />
      </div>
    </div>
  );
}
