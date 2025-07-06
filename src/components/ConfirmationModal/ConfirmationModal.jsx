"use client";

import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import styles from "./ConfirmationModal.module.css";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger, warning, info
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.titleContainer}>
            <AlertTriangle
              size={24}
              className={`${styles.icon} ${styles[type]}`}
            />
            <h3 className={styles.title}>{title}</h3>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`${styles.confirmButton} ${styles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
