import Image from "next/image";
import styles from "./Sidebar.module.css";
import InfoCard from "../InfoCard/InfoCard";
import Link from "next/link";

import { social_media } from "./data";
import myImage from "/public/images/me.jpg";
import runningImage from "/public/images/run2.jpg";
import { Globe, Star, Phone, Calendar as CalendarIcon } from "lucide-react";
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
          width={400}
          height={500}
          quality={95}
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
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
        <>
          {/* Support Running Section for Running tab */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.title}>
                <Star size={20} className={styles.icon} /> Why I Need Support
              </h3>
            </div>
            <div className={styles.supportContent}>
              <p className={styles.supportDescription}>
                To sustain this level of training and compete at my best, I
                invest heavily in:
              </p>
              <ul className={styles.supportList}>
                <li>👟 Running shoes</li>
                <li>💊 Nutrition and supplements</li>
                <li>🏋️‍♂️ Training tools</li>
                <li>👨‍⚕️ Physiotherapy sessions</li>
                <li>🦵 Massage sessions</li>
              </ul>
              <p className={styles.supportMessage}>
                Every contribution — big or small — helps me move forward and
                stay consistent. If you believe in supporting independent
                athletes, I'd truly appreciate your help.
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

          {/* Training Calendar Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.title}>
                <CalendarIcon size={20} className={styles.icon} /> Training
                Calendar
              </h3>
            </div>
            <p className={styles.supportDescription}>
              View my weekly training plan.
            </p>
            <Link href="/training" className={styles.donateButton}>
              View Training Calendar
            </Link>
          </div>
        </>
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
