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
              <Star size={20} className={styles.icon} /> Support My Running
            </h3>
          </div>
          <div className={styles.supportContent}>
            <p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>
              Help me continue my running journey! Your support helps with:
            </p>
            <ul
              style={{
                paddingLeft: "1.2rem",
                lineHeight: "1.6",
                listStyleType: "none",
                marginBottom: "1rem",
              }}
            >
              <li>🏃‍♂️ Race entry fees</li>
              <li>👟 Running gear & shoes</li>
              <li>🏃‍♂️ Training equipment</li>
              <li>💊 Supplements</li>
            </ul>
            <a
              href="https://www.paypal.com/paypalme/nahednakib"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.donateButton}
            >
              {" "}
              Support via
              <img
                src="https://www.paypalobjects.com/webstatic/de_DE/i/de-pp-logo-100px.png"
                alt="PayPal"
                style={{ width: "75px", height: "16px", marginRight: "8px" }}
              />
            </a>
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
