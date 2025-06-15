"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";
import { links } from "./data";
import Logo from "@/elements/Logo/Logo";
import DarkMoodToggle from "../DarkMoodToggle/DarkMoodToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { User, Menu, X } from "lucide-react"; // Add menu icons

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

        {user && (
          <Link
            href="/admin/"
            className={`${styles.link} ${styles.tooltip}`}
            onClick={() => setMenuOpen(false)}
          >
            <User size={22} strokeWidth="3" />
            <span className={styles.tooltipText}>Dashboard</span>
          </Link>
        )}
      </div>
    </div>
  );
}
