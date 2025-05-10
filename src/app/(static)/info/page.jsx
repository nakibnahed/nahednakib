"use client";

import styles from "./info.module.css";
import Banner from "../../../components/Banner/Banner";
import Sidebar from "../../../components/Sidebar/Sidebar";
import InfoCard from "../../../components/InfoCard/InfoCard";

import Image from "next/image";
import BlogImage2 from "/public/images/me.jpg";

// Import icons
import {
  Briefcase,
  GraduationCap,
  Code,
  FileBadge,
  Rocket,
  Globe,
} from "lucide-react";

export default function InfoPage() {
  return (
    <div className={styles.infoContainer}>
      <Banner />

      <div className={styles.mainContent}>
        <div className={styles.contentArea}>
          <InfoCard
            title="Experience"
            size="large"
            Icon={Briefcase}
            details={
              <>
                <strong>Web Developer – Insanca Yardim Vakfi</strong>
                <br />
                2024 – Present
                <br />
                - Maintained and updated the organization’s website using
                WordPress and HTML/CSS.
                <br />
                - Improved performance and optimized user experience.
                <br />
                <br />
                <strong>Web Developer – Turkey Property Club</strong>
                <br />
                Oct 2022 – 2024
                <br />
                - Edited and maintained websites using WordPress, HTML, CSS, and
                JavaScript.
                <br />
                <br />
                <strong>Web Developer – Al Sharq Forum</strong>
                <br />
                Jan 2022 – Jul 2023
                <br />
                - Worked with multiple websites under Al Sharq umbrella using
                WordPress, HTML, CSS, JavaScript, and Angular.
                <br />
                - Collaborated with IT department on frontend updates and
                maintenance.
                <br />
              </>
            }
          />

          <InfoCard
            title="Education"
            size="medium"
            Icon={GraduationCap}
            details={
              <>
                <strong>Computer Programming – Nisantasi University</strong>
                <br />
                Dec 2022 – Present
                <br />
                Focused on software development, algorithms, and web
                technologies.
              </>
            }
          />

          <InfoCard
            title="Skills"
            size="medium"
            Icon={Code}
            details={
              <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.6" }}>
                <li>
                  WordPress (Custom Themes, Plugins, Elementor, SEO
                  Optimization)
                </li>
                <li>HTML / CSS / JavaScript</li>
                <li>React / Next.js / Angular</li>
                <li>WordPress</li>
                <li>Tailwind CSS / CSS Modules</li>
                <li>Node.js / Express</li>
                <li>PostgreSQL / Prisma</li>
                <li>Git & GitHub</li>
                <li>Responsive Design</li>
              </ul>
            }
          />

          <InfoCard
            title="Projects"
            size="large"
            Icon={Rocket}
            details={
              <>
                - <strong>Personal Portfolio Website:</strong> Built with
                Next.js and dynamic content dashboard.
                <br />- <strong>Task Manager App:</strong> Full-stack app using
                React, Node.js, and PostgreSQL.
                <br />- <strong>Children’s YouTube Channel:</strong> Creating
                AI-generated animated videos.
                <br />- <strong>GitHub Projects:</strong> See more on{" "}
                <a
                  href="https://github.com/nakibnahed"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                .
              </>
            }
          />

          <InfoCard
            title="Certifications"
            size="large"
            Icon={FileBadge}
            details={
              <>
                - Meta Front-End Developer (Codecademy)
                <br />
                - JavaScript Algorithms and Data Structures (Codecademy)
                <br />- Responsive Web Design (Codecademy)
              </>
            }
          />
        </div>

        <div className={styles.sidebar}>
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
