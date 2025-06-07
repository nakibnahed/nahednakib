import Image from "next/image";
import styles from "./Sidebar.module.css";
import InfoCard from "../InfoCard/InfoCard";

import { social_media } from "./data";
import myImage from "/public/images/me.jpg";
import runningImage from "/public/images/run2.jpg";
import { Globe, Star, Phone } from "lucide-react";
import SocialLinks from "@/components/SocialLinks/SocialLinks";

export default function Sidebar({ activeTab }) {
  const displayImage = activeTab === "web" ? myImage : runningImage;

  return (
    <div className={styles.sidebar}>
      <div>
        <Image
          src={displayImage}
          alt="nahed"
          className={styles.image}
          width={300}
          height={400}
        />
      </div>

      {/* Languages Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.title}>
            <Globe size={20} className={styles.icon} /> Languages
          </h3>
        </div>
        <ul
          style={{
            paddingLeft: "1.2rem",
            lineHeight: "1.6",
            listStyleType: "none",
          }}
        >
          <li>🌐 Arabic — Native</li>
          <li>🌐 English — B2 (70%)</li>
          <li>🌐 Turkish — C1 (85%)</li>
          <li>🌐 German — (5%)</li>
        </ul>
      </div>

      {/* Hobbies Section */}
      {/* <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.title}>
            <Star size={20} className={styles.icon} /> Hobbies
          </h3>
        </div>
        <ul
          style={{
            paddingLeft: "1.2rem",
            lineHeight: "1.6",
            listStyleType: "none",
          }}
        >
          <li>🏃‍♂️ Running</li>
          <li>💻 Web Development</li>
          <li>📚 Reading</li>
          <li>🎶 Music</li>
        </ul>
      </div> */}

      {/* Contact Section */}
      <div className={styles.card}>
        <h3 className={styles.title}>
          <Phone size={20} className={styles.icon} /> Contact
        </h3>
        <p className={styles.infos}>
          <strong>Email:</strong> nahednakibyos@gmail.com
        </p>
        <p>
          <strong>Phone:</strong> (+49) 176 63816827
        </p>
      </div>

      {/* Social Links Section */}
      <div className={styles.card}>
        <h3 className={styles.title}>
          <Globe size={20} className={styles.icon} /> Social Media
        </h3>
        <div className={styles.SocialIcons}>
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}
