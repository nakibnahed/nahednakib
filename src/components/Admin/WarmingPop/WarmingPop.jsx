import React from "react";
import styles from "./WarmingPop.module.css";

export default function WarmingPop({
  isOpen,
  message = "Are you sure?",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          <button onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={onConfirm} className={styles.confirmBtn}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
