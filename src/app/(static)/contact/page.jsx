import Image from "next/image";
import SocialLinks from "@/components/SocialLinks/SocialLinks"; // Import the SocialLinks component

import styles from "./contact.module.css";

export default function Contact() {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Get in Touch</h1>
      <p className={styles.description}>
        Feel free to reach out to me through any of the social platforms below.
      </p>

      <div className={styles.contactCard}>
        <div className={styles.contactItem}>
          <span>
            <strong>Phone:</strong> (+90) 534 681 0886
          </span>
        </div>

        <div className={styles.contactItem}>
          <span>
            <strong>Email:</strong> nahednakibyos@gmail.com
          </span>
        </div>

        <div className={styles.social}>
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}
