"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";
import { links } from "./data";
import Logo from "@/elements/Logo/Logo";
import DarkMoodToggle from "../DarkMoodToggle/DarkMoodToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { Settings } from "lucide-react"; // Using lucide-react icon

export default function Navbar() {
  const [user, setUser] = useState(null);

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

  return (
    <div className={styles.container}>
      <Logo />
      <div className={styles.links}>
        {/* <DarkMoodToggle /> */}
        {links.map((link) => (
          <Link key={link.id} href={link.url} className={styles.link}>
            {link.title}
          </Link>
        ))}

        {user && (
          <Link href="/admin/" className={`${styles.link} ${styles.tooltip}`}>
            <Settings size={22} />
            <span className={styles.tooltipText}>Dashboard</span>
          </Link>
        )}
      </div>
    </div>
  );
}
