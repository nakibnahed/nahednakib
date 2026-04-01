"use client";

import { useState, useEffect } from "react";
import { Check, X, AlertCircle, Info, AlertTriangle } from "lucide-react";
import styles from "./Toast.module.css";

const Toast = ({
  message,
  type = "success",
  duration = 3000,
  onClose,
  stackIndex = 0,
}) => {
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
        return <Check size={18} strokeWidth={2.25} />;
      case "error":
        return <AlertCircle size={18} strokeWidth={2} />;
      case "info":
        return <Info size={18} strokeWidth={2} />;
      case "warning":
        return <AlertTriangle size={18} strokeWidth={2} />;
      default:
        return <Check size={18} strokeWidth={2.25} />;
    }
  };

  const topOffset = 72 + stackIndex * 76;

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${
        isVisible ? styles.show : styles.hide
      }`}
      style={{ top: `${topOffset}px` }}
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
