import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { Card } from "@/components/card/card";
import { portfolios } from "@/app/(dynamic)/portfolio/data";
import EyeIcon from "/public/images/globe.svg";

export default function Portfolio() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Crafted with Code & Passion</h1>
      <div className={styles.mainContainer}>
        {portfolios.map((portfolio) => (
          <Link
            key={portfolio.id}
            href={`/portfolio/${portfolio.id}`}
            className={styles.post}
          >
            <Card>
              <div className={styles.container}>
                <div className={styles.content}>
                  <div className={styles.icon}>
                    <Image
                      src={EyeIcon}
                      alt="eye icon"
                      width={24}
                      height={24}
                    />
                  </div>
                  <h1 className={styles.title}>{portfolio.title}</h1>
                  <p className={styles.date}>{portfolio.date}</p>
                  <p className={styles.description}>{portfolio.description}</p>
                  <div className={styles.readMore}>
                    <span>Read More</span>
                    <span className={styles.arrow}>→</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
