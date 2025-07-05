import UserSidebar from "@/components/User/Sidebar/UserSidebar";
import styles from "./UserLayout.module.css";

export default function UserLayout({ children, user, profileData }) {
  return (
    <div className={styles.container}>
      <UserSidebar user={user} profileData={profileData} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
