"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./showcase.module.css";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Code,
  Database,
  Globe,
  Smartphone,
  Palette,
  Zap,
  ChevronRight,
  Star,
  Award,
  Calendar,
  MapPin,
  ExternalLink,
  Play,
  Pause,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function Showcase() {
  const [activeSkill, setActiveSkill] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();

  // Parallax transforms
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Mouse tracking for subtle particle effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Code example
  const codeExample = `const Portfolio = () => {
  return (
    <div className="showcase">
      <AnimatedCards />
      <InteractiveTimeline />
      <LiveDemos />
    </div>
  );
};`;

  // Skills data with proficiency levels
  const skills = [
    { name: "React", level: 95, icon: Code, color: "#61DAFB", projects: 12 },
    { name: "Next.js", level: 90, icon: Globe, color: "#000000", projects: 8 },
    {
      name: "JavaScript",
      level: 92,
      icon: Code,
      color: "#F7DF1E",
      projects: 15,
    },
    {
      name: "TypeScript",
      level: 85,
      icon: Code,
      color: "#3178C6",
      projects: 6,
    },
    {
      name: "Node.js",
      level: 88,
      icon: Database,
      color: "#339933",
      projects: 10,
    },
    {
      name: "CSS/SCSS",
      level: 93,
      icon: Palette,
      color: "#1572B6",
      projects: 20,
    },
    {
      name: "Responsive Design",
      level: 96,
      icon: Smartphone,
      color: "#FF6B6B",
      projects: 18,
    },
    {
      name: "Performance",
      level: 89,
      icon: Zap,
      color: "#FFD700",
      projects: 7,
    },
  ];

  // Experience timeline
  const experience = [
    {
      year: "2024",
      title: "Senior Web Developer",
      company: "Insanca Yardim Vakfi",
      description:
        "Leading development team, implementing modern web solutions",
      technologies: ["React", "Next.js", "TypeScript"],
      achievements: [
        "Improved site performance by 40%",
        "Led team of 3 developers",
      ],
    },
    {
      year: "2022-2024",
      title: "Full Stack Developer",
      company: "Turkey Property Club",
      description: "Built and maintained multiple client websites",
      technologies: ["WordPress", "PHP", "JavaScript"],
      achievements: [
        "Delivered 15+ client projects",
        "Reduced loading times by 60%",
      ],
    },
    {
      year: "2022-2023",
      title: "Frontend Developer",
      company: "Al Sharq Forum",
      description: "Developed interactive web applications",
      technologies: ["Angular", "HTML/CSS", "JavaScript"],
      achievements: [
        "Created 8+ interactive features",
        "Improved UX scores by 35%",
      ],
    },
  ];

  // Certifications
  const certifications = [
    {
      name: "React Developer Certification",
      issuer: "Meta",
      date: "2024",
      link: "#",
      verified: true,
    },
    {
      name: "Next.js Advanced Patterns",
      issuer: "Vercel",
      date: "2024",
      link: "#",
      verified: true,
    },
    {
      name: "Web Performance Optimization",
      issuer: "Google",
      date: "2023",
      link: "#",
      verified: true,
    },
  ];

  return (
    <div className="pageMainContainer">
      <div className={styles.container} ref={containerRef}>
        {/* Subtle Particle Effects */}
        <div className={styles.particles}>
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.particle}
              animate={{
                x: mousePosition.x + Math.sin(i) * 40,
                y: mousePosition.y + Math.cos(i) * 40,
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>

        {/* Hero Section */}
        <motion.section className={styles.hero} style={{ y: y1 }}>
          <motion.div
            className={styles.heroGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className={styles.heroLeft}>
              <motion.div
                className={styles.techStack}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className={styles.techItem}>
                  <Code size={24} />
                  <span>React</span>
                </div>
                <div className={styles.techItem}>
                  <Globe size={24} />
                  <span>Next.js</span>
                </div>
                <div className={styles.techItem}>
                  <Database size={24} />
                  <span>Node.js</span>
                </div>
              </motion.div>

              <motion.h1
                className={styles.heroTitle}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Crafting Digital
                <span className={styles.highlight}> Experiences</span>
              </motion.h1>

              <motion.p
                className={styles.heroSubtitle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                From concept to deployment, I transform ideas into interactive
                web applications with modern technologies and creative
                solutions.
              </motion.p>
            </div>

            <div className={styles.heroRight}>
              <motion.div
                className={styles.codePreview}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className={styles.codeHeader}>
                  <div className={styles.codeDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>portfolio.jsx</span>
                </div>
                <div className={styles.codeContent}>
                  <SyntaxHighlighter
                    language="jsx"
                    style={tomorrow}
                    customStyle={{
                      margin: 0,
                      background: "transparent",
                      fontSize: "0.85rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {codeExample}
                  </SyntaxHighlighter>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroButtons}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link href="/portfolio" className={styles.button}>
              <span>View Work</span>
              <span className={styles.arrow}>→</span>
            </Link>
            <Link
              href="/contact"
              className={`${styles.button} ${styles.secondaryButton}`}
            >
              <span>Let's Talk</span>
              <span className={styles.arrow}>→</span>
            </Link>
          </motion.div>
        </motion.section>

        {/* Interactive Skill Tree */}
        <section className={styles.skillsSection}>
          <motion.h2
            className={styles.sectionTitle}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Skills & Expertise
          </motion.h2>

          <div className={styles.skillsGrid}>
            {skills.map((skill, index) => (
              <motion.div
                key={skill.name}
                className={styles.skillCard}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                }}
                onClick={() =>
                  setActiveSkill(activeSkill === skill.name ? null : skill.name)
                }
              >
                <div className={styles.skillHeader}>
                  <skill.icon size={24} style={{ color: skill.color }} />
                  <h3>{skill.name}</h3>
                  <span className={styles.projectsCount}>
                    {skill.projects} projects
                  </span>
                </div>

                <div className={styles.progressBar}>
                  <motion.div
                    className={styles.progressFill}
                    style={{ backgroundColor: skill.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>

                <span className={styles.proficiency}>{skill.level}%</span>
              </motion.div>
            ))}
          </div>

          {/* Skill Details Modal */}
          <AnimatePresence>
            {activeSkill && (
              <motion.div
                className={styles.skillModal}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className={styles.modalContent}>
                  <h3>{activeSkill}</h3>
                  <p>
                    Detailed information about {activeSkill} skills and
                    projects...
                  </p>
                  <button onClick={() => setActiveSkill(null)}>Close</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Animated Experience Timeline */}
        <section className={styles.timelineSection}>
          <motion.h2
            className={styles.sectionTitle}
            style={{ y: y2 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Professional Journey
          </motion.h2>

          <div className={styles.timeline}>
            {experience.map((exp, index) => (
              <motion.div
                key={exp.year}
                className={styles.timelineItem}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className={styles.timelineDot} />
                <div className={styles.timelineContent}>
                  <div className={styles.timelineHeader}>
                    <h3>{exp.title}</h3>
                    <span className={styles.company}>{exp.company}</span>
                    <span className={styles.year}>{exp.year}</span>
                  </div>
                  <p>{exp.description}</p>
                  <div className={styles.technologies}>
                    {exp.technologies.map((tech) => (
                      <span key={tech} className={styles.techTag}>
                        {tech}
                      </span>
                    ))}
                  </div>
                  <ul className={styles.achievements}>
                    {exp.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3D Certifications */}
        <section className={styles.certificationsSection}>
          <motion.h2
            className={styles.sectionTitle}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Certifications & Achievements
          </motion.h2>

          <div className={styles.certificationsGrid}>
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                className={styles.certificationCard}
                initial={{ opacity: 0, rotateY: -90 }}
                whileInView={{ opacity: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{
                  rotateY: 5,
                  scale: 1.02,
                }}
              >
                <div className={styles.certHeader}>
                  <Award size={24} />
                  <h3>{cert.name}</h3>
                </div>
                <p className={styles.issuer}>{cert.issuer}</p>
                <p className={styles.date}>{cert.date}</p>
                {cert.verified && (
                  <div className={styles.verified}>
                    <Star size={16} />
                    <span>Verified</span>
                  </div>
                )}
                <a href={cert.link} className={styles.verifyLink}>
                  <ExternalLink size={16} />
                  Verify Certificate
                </a>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Loading State Animation */}
        <motion.div
          className={styles.loadingOverlay}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2, delay: 1 }}
        >
          <div className={styles.loader}>
            <motion.div
              className={styles.loaderCircle}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p>Loading amazing content...</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
