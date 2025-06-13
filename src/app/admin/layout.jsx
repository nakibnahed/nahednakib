import Link from "next/link";
import styles from "./AdminLayout.module.css";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

// Import LogoutButton client component
import LogoutButton from "@/components/LogoutButton/LogoutButton";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("sb-access-token")?.value;

  if (!access_token) {
    redirect("/login");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const {
    data: { user },
  } = await supabase.auth.getUser(access_token);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h3>Admin Panel</h3>
        <ul>
          <li>
            <Link href="/admin">Dashboard</Link>
          </li>
          <li>
            <Link href="/admin/portfolio">Portfolio</Link>
          </li>
          <li>
            <Link href="/admin/blogs">Blogs</Link>
          </li>
          <li>
            <Link href="/admin/contact">Contact Forms</Link>
          </li>
          <li>
            <LogoutButton />
          </li>
        </ul>
      </nav>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
