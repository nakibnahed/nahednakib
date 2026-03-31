/**
 * Fires the global toast from {@link ToastContainer} (root layout).
 * Same pattern as conversation-practice and admin notifications.
 */
export function showAppToast(message, type = "success") {
  if (typeof window !== "undefined" && typeof window.showToast === "function") {
    window.showToast(message, type);
  }
}
