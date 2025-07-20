// components/SocialLinks/SocialLinks.jsx

import Image from "next/image"; // Importing Next.js Image component
import { socialLinks } from "./socialLinksData"; // Import the data
import { SiStrava } from "react-icons/si";

import styles from "./socialLinks.module.css"; // Import the CSS Module for styling

const SocialLinks = () => {
  return (
    <div className={styles.container}>
      {/* Render social media icons dynamically */}
      <div className={styles.icons}>
        {socialLinks.map((link) => (
          <a
            key={link.id}
            href={link.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.name === "strava" ? (
              <SiStrava
                size={21}
                className={styles.icon}
                title="Strava"
                color="var(--primary-color)"
              />
            ) : (
              <Image
                src={`/images/icons/${link.name}.png`}
                alt={`Nahed Nakib ${link.name} Icon`}
                width={21}
                height={21}
                className={styles.icon}
              />
            )}
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialLinks;
