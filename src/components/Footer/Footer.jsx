// Footer.jsx
import SocialLinks from "@/components/SocialLinks/SocialLinks"; // Import the SocialLinks component
import styles from "./footer.module.css"; // Keep your existing footer styles

export default function Footer() {
  return (
    <div className={styles.container}>
      <div>©2025 Nahed. All Right Reserved.</div>
      <div className={styles.social}>
        <SocialLinks /> {/* Render the SocialLinks component */}
      </div>
    </div>
  );
}
