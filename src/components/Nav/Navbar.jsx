"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";
import Logo from "@/elements/Logo/Logo";
import DarkMoodToggle from "../DarkMoodToggle/DarkMoodToggle";
import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthSession } from "@/context/AuthSessionContext";
import {
  User,
  Menu,
  X,
  Info,
  Briefcase,
  FileText,
  Mail,
  Layers,
  BarChart,
  ChevronDown,
  HelpCircle,
  Shield,
  MessageSquare,
  Video,
  BookOpen,
  Download,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import NotificationIcon from "../NotificationIcon/NotificationIcon";
import Image from "next/image";

const navLinks = [
  { id: 1, url: "/portfolio", title: "Portfolio", icon: Briefcase },
  { id: 2, url: "/services", title: "Services", icon: Layers },
  { id: 3, url: "/blog", title: "Blog", icon: FileText },
  { id: 4, url: "/about", title: "About", icon: Info },
  { id: 5, url: "/contact", title: "Contact", icon: Mail },
];

export default function Navbar() {
  const { user: rawUser, initialized } = useAuthSession();
  const [resetPending, setResetPending] = useState(false);
  const [userProfile, setUserProfile] = useState(undefined);
  const pathname = usePathname();

  // Re-check on every navigation so the flag set by auth/callback is picked up
  // before the navbar renders the avatar on /reset-password.
  useEffect(() => {
    setResetPending(!!sessionStorage.getItem("pwd_reset_pending"));
  }, [pathname]);

  const user = resetPending ? null : rawUser;

  // Runs synchronously after render but before paint, so the placeholder is
  // shown immediately when user changes without a stale-profile frame.
  useLayoutEffect(() => {
    if (user) {
      setUserProfile(undefined);
    }
  }, [user]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    if (!user) {
      setUserProfile(null);
      return () => {
        mounted = false;
      };
    }

    const loadProfile = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!mounted) return;
        setUserProfile(profileError ? null : profile);
      } catch {
        if (!mounted) return;
        setUserProfile(null);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
  const toggleContactDropdown = useCallback(
    () => setContactDropdownOpen((open) => !open),
    [],
  );

  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = parseInt(document.body.style.top || "0", 10);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, -scrollY);
    }
    return () => {
      const scrollY = parseInt(document.body.style.top || "0", 10);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) window.scrollTo(0, -scrollY);
    };
  }, [menuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setContactDropdownOpen(false);
      }
    };

    if (contactDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contactDropdownOpen]);

  const getProfileUrl = useCallback(() => {
    if (!user) return "/login";
    return "/users/dashboard";
  }, [user]);

  const renderUserIcon = useCallback(() => {
    if (!initialized || (user && userProfile === undefined)) {
      return <div className={styles.userIconPlaceholder} />;
    }
    if (user && userProfile?.avatar_url) {
      return (
        <Image
          src={userProfile.avatar_url}
          alt="User Avatar"
          width={32}
          height={32}
          className={styles.userAvatar}
        />
      );
    }
    return <User size={32} strokeWidth={3} />;
  }, [initialized, user, userProfile]);

  return (
    <div className={styles.navbarFixedBg}>
      <div className={styles.container}>
        <Logo />

        {/* Centered menu links */}
        <nav className={styles.centerNav}>
          <div className={styles.linksWrapper}>
            {navLinks.map((link) => {
              if (link.title === "Contact") {
                return (
                  <div
                    key={link.id}
                    className={styles.dropdownContainer}
                    ref={dropdownRef}
                  >
                    <button
                      className={`${styles.link} ${styles.dropdownTrigger}`}
                      onClick={toggleContactDropdown}
                      aria-expanded={contactDropdownOpen}
                      aria-haspopup="true"
                    >
                      {link.title}
                      <ChevronDown
                        size={14}
                        className={`${styles.dropdownIcon} ${
                          contactDropdownOpen ? styles.dropdownIconOpen : ""
                        }`}
                      />
                    </button>
                    {contactDropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        <Link href="/contact" className={styles.dropdownItem}>
                          <Mail size={16} />
                          Contact Us
                        </Link>
                        <Link
                          href="/learning-tracker"
                          className={styles.dropdownItem}
                        >
                          <BookOpen size={16} />
                          Learning Tracker
                        </Link>
                        <Link
                          href="/conversation-practice"
                          className={styles.dropdownItem}
                        >
                          <Video size={16} />
                          Meetings
                        </Link>
                        <Link href="/feedback" className={styles.dropdownItem}>
                          <MessageSquare size={16} />
                          Feedback
                        </Link>
                        <Link href="/faq" className={styles.dropdownItem}>
                          <HelpCircle size={16} />
                          FAQ
                        </Link>
                        <Link href="/privacy" className={styles.dropdownItem}>
                          <Shield size={16} />
                          Privacy Policy
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link key={link.id} href={link.url} className={styles.link}>
                  {link.title}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right section: Notifications, User, Chart, Dark mode */}
        <div className={styles.rightSection}>
          {user && <NotificationIcon />}
          <Link
            href={getProfileUrl()}
            className={styles.dashboardIconOnly}
            aria-label="User"
          >
            {renderUserIcon()}
          </Link>
          <div className={styles.chartIconWrapper}>
            <Link href="/analytics" className={styles.chartIcon}>
              <BarChart size={26} strokeWidth={3} />
            </Link>
            <div className={styles.tooltip}>Site Analytics</div>
          </div>
          <DarkMoodToggle />
        </div>

        {/* Mobile right: notifications, user icon, chart, burger */}
        <div className={styles.mobileRight}>
          {user && <NotificationIcon />}
          <Link
            href={getProfileUrl()}
            className={styles.userMobileIcon}
            aria-label="User"
          >
            {renderUserIcon()}
          </Link>
          <div className={styles.chartIconWrapper}>
            <Link href="/analytics" className={styles.chartMobileIcon}>
              <BarChart size={26} strokeWidth={3} />
            </Link>
            <div className={styles.tooltip}>Site Analytics</div>
          </div>
          <button
            className={styles.menuIcon}
            onClick={toggleMenu}
            aria-label="Open menu"
            type="button"
          >
            {menuOpen ? (
              <X size={26} strokeWidth={3} />
            ) : (
              <Menu size={26} strokeWidth={3} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`${styles.mobileMenu} ${
            menuOpen ? styles.mobileMenuOpen : ""
          }`}
        >
          {/* Menu Header */}
          <div className={styles.mobileMenuHeader}>
            <Link
              href={getProfileUrl()}
              className={styles.profileButton}
              onClick={() => setMenuOpen(false)}
            >
              {!initialized || (user && userProfile === undefined) ? (
                <div className={styles.userIconPlaceholderSm} />
              ) : user && userProfile?.avatar_url ? (
                <Image
                  src={userProfile.avatar_url}
                  alt="User Avatar"
                  width={24}
                  height={24}
                  className={styles.userAvatar}
                />
              ) : (
                <User size={24} />
              )}
              <span>Profile</span>
            </Link>

            <div className={styles.mobileMenuHeaderRight}>
              <DarkMoodToggle />
              <button
                className={styles.closeMenu}
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Menu Links */}
          <div className={styles.MenuLinks}>
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              if (link.title === "Contact") {
                return (
                  <div key={link.id}>
                    {[
                      { href: "/learning-tracker", Icon: BookOpen, label: "Learning Tracker" },
                      { href: "/conversation-practice", Icon: Video, label: "Meetings" },
                      { href: "/contact", Icon: Mail, label: "Contact Us" },
                      { href: "/feedback", Icon: MessageSquare, label: "Feedback" },
                      { href: "/faq", Icon: HelpCircle, label: "FAQ" },
                      { href: "/privacy", Icon: Shield, label: "Privacy Policy" },
                    ].map(({ href, Icon, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className={styles.mobileMenuLink}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon size={20} />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>
                );
              }
              return (
                <Link
                  key={link.id}
                  href={link.url}
                  className={styles.mobileMenuLink}
                  onClick={() => setMenuOpen(false)}
                >
                  <IconComponent size={20} />
                  <span>{link.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
