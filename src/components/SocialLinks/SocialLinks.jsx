// components/SocialLinks/SocialLinks.jsx

import Image from "next/image"; // Importing Next.js Image component
import { socialLinks } from "./socialLinksData"; // Import the data

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
            <Image
              src={`/images/icons/${link.name}.png`} // Path to the icon images
              alt={`Nahed Nakib ${link.name} Icon`} // Alt text for accessibility
              width={21} // Set the width of the icon
              height={21} // Set the height of the icon
              className={styles.icon} // Apply the icon styles
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialLinks;
