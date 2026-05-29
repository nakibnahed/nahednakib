// Footer.jsx
import SocialLinks from "@/components/SocialLinks/SocialLinks"; // Import the SocialLinks component
import styles from "./footer.module.css";

export default function Footer() {
  return (
    <div className={styles.container}>
      <div>
        <p>©{new Date().getFullYear()} Nahed. All Rights Reserved.</p>
      </div>
      <div className={styles.social}>
        <SocialLinks />
      </div>
    </div>
  );
}
