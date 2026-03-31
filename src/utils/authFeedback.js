const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function getPasswordChecks(password) {
  const value = password || "";
  return {
    minLength: value.length >= 8,
    hasLetter: /[A-Za-z]/.test(value),
    hasNumber: /\d/.test(value),
  };
}

export function isPasswordStrong(password) {
  const checks = getPasswordChecks(password);
  return Object.values(checks).every(Boolean);
}

export function mapAuthError(error, context = "generic") {
  const msg = (error?.message || "").toLowerCase();
  const status = Number(error?.status || 0);

  if (!msg) return "Something went wrong. Please try again.";
  if (msg.includes("invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please confirm your email first, then login.";
  }
  if (msg.includes("already registered") || msg.includes("user already registered")) {
    return "This email is already registered. Try logging in or reset your password.";
  }
  if (msg.includes("password should be at least")) {
    return "Password is too weak. Use at least 8 characters.";
  }
  if (
    status === 429 ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("security purposes") ||
    msg.includes("you can only request this after")
  ) {
    return "Too many reset attempts. Please wait 60 seconds, then try again.";
  }
  if (msg.includes("network")) {
    return "Network issue. Check your connection and try again.";
  }
  if (context === "forgot") {
    return "Could not send reset email. Please try again.";
  }
  if (context === "register") {
    return "Could not create account. Please check your details and try again.";
  }
  if (context === "login") {
    return "Could not login right now. Please try again.";
  }
  if (context === "reset") {
    return "Could not reset password. Please request a new reset link.";
  }
  return "Something went wrong. Please try again.";
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" && window.location?.origin) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
