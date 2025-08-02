import Image from "next/image";
import styles from "./Sidebar.module.css";
import InfoCard from "../InfoCard/InfoCard";

import { social_media } from "./data";
import myImage from "/public/images/me.jpg";
import runningImage from "/public/images/run2.jpg";
import { Globe, Star, Phone } from "lucide-react";
import SocialLinks from "@/components/SocialLinks/SocialLinks";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar({ activeTab }) {
  const displayImage = activeTab === "web" ? myImage : runningImage;
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSession();
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => listener?.subscription?.unsubscribe();
  }, []);

  const phoneNumber = "(+49) 176 63816827";
  const maskedNumber = "(+49) 176 ********";

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
      {/* Conditional Card based on active tab */}
      {activeTab === "web" ? (
        /* Languages Section for Web tab */
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
            <li>Arabic — Native</li>
            <li>English — B2 (70%)</li>
            <li>Turkish — C1 (85%)</li>
            <li>German — (5%)</li>
          </ul>
        </div>
      ) : (
        /* Support Running Section for Running tab */
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.title}>
              <Star size={20} className={styles.icon} /> Why I Need Support
            </h3>
          </div>
          <div className={styles.supportContent}>
            <p className={styles.supportDescription}>
              To sustain this level of training and compete at my best, I invest
              heavily in:
            </p>
            <ul className={styles.supportList}>
              <li>🏃‍♂️ Race entry fees and travel</li>
              <li>👟 Running shoes</li>
              <li>💊 Nutrition and supplements</li>
              <li>🏋️‍♂️ Training tools and recovery gear</li>
            </ul>
            <p className={styles.supportMessage}>
              Every contribution — big or small — helps me move forward and stay
              consistent. If you believe in supporting independent athletes, I'd
              truly appreciate your help. You're not just donating — you're
              becoming part of the journey.
            </p>
            <a
              href="https://www.paypal.com/paypalme/nahednakib/25"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.donateButton}
            >
              {" "}
              Support via
              <img
                src="https://www.paypalobjects.com/webstatic/de_DE/i/de-pp-logo-100px.png"
                alt="PayPal"
                className={styles.paypalLogo}
              />
            </a>
            <p className={styles.thankYouMessage}>
              Thank you for being part of my running story. 🙏
            </p>
          </div>
        </div>
      )}
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
          <strong>Phone: </strong>{" "}
          {user ? (
            <span>{phoneNumber}</span>
          ) : (
            <span className={styles.maskedPhone} tabIndex={0}>
              {maskedNumber}
              <span className={styles.tooltip}>
                For privacy, log in to see the full number.
              </span>
            </span>
          )}
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
