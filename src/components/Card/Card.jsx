import React from "react";
import styles from "./card.module.css";

export function Card({ children }) {
  return <div className={styles.container}>{children}</div>;
}
