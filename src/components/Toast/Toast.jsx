"use client";

import { useState, useEffect } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";
import styles from "./Toast.module.css";

const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check size={16} />;
      case "error":
        return <AlertCircle size={16} />;
      case "info":
        return <Info size={16} />;
      default:
        return <Check size={16} />;
    }
  };

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${
        isVisible ? styles.show : styles.hide
      }`}
    >
      <div className={styles.icon}>{getIcon()}</div>
      <div className={styles.message}>{message}</div>
      <button
        className={styles.closeButton}
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => {
            onClose();
          }, 300);
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
