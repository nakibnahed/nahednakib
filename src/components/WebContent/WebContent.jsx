// src/components/WebContent/WebContent.jsx
import InfoCard from "../InfoCard/InfoCard";
import styles from "./WebContent.module.css";
import { Briefcase, GraduationCap, Code, Rocket, MapPin } from "lucide-react";

export default function WebContent() {
  return (
    <div className={styles.container}>
      <InfoCard
        title="Education"
        size="medium"
        Icon={GraduationCap}
        details={
          <>
            <div>
              <p>
                <strong> Nisantasi University </strong> <br /> Computer
                Programming
              </p>
              <br />
              <p> Dec 2022 - Present</p>

              <p>
                Focused on software development, algorithms, and web
                technologies.
              </p>
              <br />
            </div>
          </>
        }
      />

      <InfoCard
        title="Skills"
        size="medium"
        Icon={Code}
        details={
          <ul style={{ listStyle: "none", paddingLeft: "1.2em", margin: 0 }}>
            <li>WordPress</li>
            <li>HTML / CSS / JavaScript</li>
            <li>React / Next.js / Angular</li>
            <li>Responsive Design</li>
            <li>Git & GitHub</li>
          </ul>
        }
      />

      <InfoCard
        title="Experience"
        size="large"
        Icon={Briefcase}
        details={
          <>
            <p>
              <strong>Web Developer - Insanca Yardim Vakfi</strong>
              <br />
              2024 - Present
            </p>
            <p>
              - Maintained and updated the organization's website using
              WordPress and HTML/CSS.
            </p>
            <p>- Improved performance and optimized user experience.</p>
            <br />
            <p>
              <strong>Web Developer - Turkey Property Club</strong>
              <br />
              Oct 2022 - 2024
            </p>
            <p>
              - Edited and maintained websites using WordPress, HTML, CSS, and
              JavaScript.
            </p>
            <br />
            <p>
              <strong>Web Developer - Al Sharq Forum</strong>
              <br />
              Jan 2022 - Jul 2023
            </p>
            <p>
              - Worked with multiple websites under Al Sharq umbrella using
              WordPress, HTML, CSS, JavaScript, and Angular.
            </p>
            <p>
              - Collaborated with IT department on frontend updates and
              maintenance.
            </p>
            <br />
          </>
        }
      />

      <InfoCard
        title="Projects"
        size="large"
        Icon={Rocket}
        details={
          <>
            <p>
              - <strong>Personal Website:</strong> Built with Next.js and
              dynamic content dashboard.
            </p>

            <br />
            <p>
              - <strong>Task Manager App:</strong> Full-stack app using React,
              Node.js, and PostgreSQL.
            </p>

            <br />
            <p>
              - <strong>Children's YouTube Channel:</strong> Creating
              AI-generated animated videos.
            </p>
            <br />
            <p>
              - <strong>GitHub Projects:</strong> See more on
              <a
                href="https://github.com/nakibnahed"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              .
            </p>
            <br />
          </>
        }
      />
    </div>
  );
}
