"use client";

import styles from "./LogoutButton.module.css"; // We'll create this
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button onClick={handleLogout} className={styles.button}>
      <span className={styles.buttonText}>Logout</span>
    </button>
  );
}
