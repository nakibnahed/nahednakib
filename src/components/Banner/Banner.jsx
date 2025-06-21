import Link from "next/link";
import styles from "./Banner.module.css";
import { ArrowLeft } from "lucide-react";

export default function Banner({ activeTab, setActiveTab }) {
  return (
    <div className={styles.banner}>
      <div className={styles.bannerContent}>
        <div className={styles.title}>
          <h1>Nahed Nakib</h1>
          <p>
            Explore my skills and experience in web development and distance
            running.
          </p>
        </div>
        <div className={styles.toggleButtons}>
          <div className={styles.backButton}>
            <Link href="/about" className={styles.tabButton}>
              <ArrowLeft size={21} strokeWidth={3} />
            </Link>
          </div>
          <button
            className={`${styles.tabButton} ${
              activeTab === "web" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("web")}
          >
            Programing
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "running" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("running")}
          >
            Running
          </button>
        </div>
      </div>
    </div>
  );
}
