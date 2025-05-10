// src/components/Banner/Banner.jsx
import styles from "./Banner.module.css";
import { Mail, MapPin, Phone, Calendar, Flag } from "lucide-react";

export default function Banner() {
  return (
    <div className={styles.banner}>
      <div className={styles.bannerContent}>
        <div className={styles.title}>
          <h1>Nahed Nakib</h1>
          <p>Web Developer & Professional Runner</p>
        </div>
        <div className={styles.info}>
          <p>
            <Flag size={16} /> <strong>Nationality : </strong> Syrian
          </p>
          <p>
            <Calendar size={16} /> <strong>Date of Birth : </strong> 06/04/1997
          </p>
          <p>
            <Phone size={16} /> <strong>Phone Number : </strong> (+49) 176
            63816827
          </p>
          <p>
            <Mail size={16} /> <strong>Email Address : </strong>{" "}
            nahednakibyos@gmail.com
          </p>
          <p>
            <MapPin size={16} /> <strong>Address : </strong> ZUE Neuss,
            Obertorweg 1, 41460 Neuss
          </p>
        </div>
      </div>
    </div>
  );
}
