"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./showcase.module.css";
import { motion, useScroll, useTransform } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function Showcase() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [portfolios, setPortfolios] = useState([]);
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

  // Fetch portfolio data from Supabase on the client
  useEffect(() => {
    const fetchPortfolios = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("portfolios")
        .select(
          "id, title, description, created_at, category, image, technologies"
        )
        .order("created_at", { ascending: false });
      if (!error && data) {
        setPortfolios(data);
      }
    };
    fetchPortfolios();
  }, []);

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

        {/* Dynamic Portfolio Timeline */}
        <section className={styles.timelineSection}>
          <motion.h2
            className={styles.sectionTitle}
            style={{ y: y2 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Crafted with Passion
          </motion.h2>

          <div className={styles.timeline}>
            {portfolios.length === 0 ? (
              <p>No portfolio projects found.</p>
            ) : (
              portfolios.map((project, index) => (
                <motion.div
                  key={project.id}
                  className={styles.timelineItem}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className={styles.timelineDot} />
                  <Link
                    href={`/portfolio/${project.id}`}
                    className={styles.timelineContent}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className={styles.timelineHeader}>
                      <h3>{project.title}</h3>
                      <span className={styles.company}>{project.category}</span>
                      <span className={styles.year}>
                        {project.created_at?.slice(0, 10)}
                      </span>
                    </div>
                    <p>{project.description}</p>
                    {project.technologies && (
                      <div className={styles.technologies}>
                        {project.technologies.split(",").map((tech) => (
                          <span key={tech} className={styles.techTag}>
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div
                      className="readMore"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        color: "var(--primary-color)",
                        fontSize: 14,
                        fontWeight: 500,
                        marginTop: 16,
                      }}
                    >
                      <span>Read More</span>
                      <span
                        style={{
                          fontSize: 18,
                          transition: "transform 0.3s ease",
                        }}
                      >
                        →
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
