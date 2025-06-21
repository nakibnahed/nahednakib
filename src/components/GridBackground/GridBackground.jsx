import React from "react";
import styles from "./gridBackground.module.css";

export default function GridBackground() {
  const hLines = [120, 220, 320, 420, 520];
  const vLines = [200, 400, 600, 800];

  return (
    <svg
      className={styles.gridBackground}
      width="100%"
      height="100%"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Horizontal fades */}
        <linearGradient
          id="fadeH1"
          x1="0"
          y1="0"
          x2="1000"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="transparent" />
          <stop offset="0.1" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
        <linearGradient
          id="fadeH2"
          x1="1000"
          y1="0"
          x2="0"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="transparent" />
          <stop offset="0.1" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
        {/* Vertical fades */}
        <linearGradient
          id="fadeV1"
          x1="0"
          y1="0"
          x2="0"
          y2="600"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="transparent" />
          <stop offset="0.1" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
        <linearGradient
          id="fadeV2"
          x1="0"
          y1="600"
          x2="0"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="transparent" />
          <stop offset="0.1" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>
      {/* Horizontal lines */}
      {hLines.map((y, i) => (
        <line
          key={`h${y}`}
          x1="0"
          y1={y}
          x2="1000"
          y2={y}
          stroke={`url(#fadeH${i % 2 === 0 ? 1 : 2})`}
          strokeWidth="2"
          className={styles.animatedLine}
          style={{
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}
      {/* Vertical lines */}
      {vLines.map((x, i) => (
        <line
          key={`v${x}`}
          x1={x}
          y1="0"
          x2={x}
          y2="600"
          stroke={`url(#fadeV${i % 2 === 0 ? 1 : 2})`}
          strokeWidth="2"
          className={styles.animatedLineV}
          style={{
            animationDelay: `${i * 0.7 + 0.3}s`,
          }}
        />
      ))}
    </svg>
  );
}
