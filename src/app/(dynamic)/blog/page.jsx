import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { Card } from "@/components/card/card";

import { blogs } from "./data"; // Import blog data
import EyeIcon from "/public/globe.svg"; // Import your eye.svg icon

export default function Blog() {
  return (
    <div className={styles.mainContainer}>
      {blogs.map((blog) => (
        <Link key={blog.id} href={`/blog/${blog.id}`} className={styles.post}>
          <Card>
            <div className={styles.container}>
              <div className={styles.content}>
                {/* Eye Icon */}
                <div className={styles.icon}>
                  <Image src={EyeIcon} alt="eye icon" width={24} height={24} />
                </div>

                <h1 className={styles.title}>{blog.title}</h1>
                <p className={styles.date}>{blog.date}</p>
                <p
                  className={styles.description}
                  dangerouslySetInnerHTML={{
                    __html: blog.description, // Short description
                  }}
                ></p>
                <div className={styles.readMore}>
                  <span>Read More</span>
                  <span className={styles.arrow}>→</span> {/* Arrow icon */}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
