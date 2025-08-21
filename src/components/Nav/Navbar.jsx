"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";
import Logo from "@/elements/Logo/Logo";
import DarkMoodToggle from "../DarkMoodToggle/DarkMoodToggle";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import {
  User,
  Menu,
  X,
  Info,
  Briefcase,
  FileText,
  Mail,
  Activity,
  BarChart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import NotificationIcon from "../NotificationIcon/NotificationIcon";
import Image from "next/image";

const navLinks = [
  { id: 1, url: "/info", title: "Running", icon: Activity },
  { id: 2, url: "/portfolio", title: "Portfolio", icon: Briefcase },
  { id: 3, url: "/blog", title: "Blog", icon: FileText },
  { id: 4, url: "/about", title: "About", icon: Info },
  { id: 5, url: "/contact", title: "Contact", icon: Mail },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let profileFetchTimeout;

    const getSession = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Session error:", error);
          setError(error.message);
          setUser(null);
          setUserRole(null);
          setUserProfile(null);
        } else {
          setUser(session?.user || null);

          // Admin check will be done after profile fetch
          if (session?.user) {
            setUserRole("user"); // Default to user, will update after profile fetch

            // Fetch user profile data with delay to avoid conflicts
            profileFetchTimeout = setTimeout(async () => {
              if (!mounted) return;

              try {
                const { data: profile, error: profileError } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", session.user.id)
                  .single();

                if (!mounted) return;

                if (profileError) {
                  console.error("Profile fetch error:", profileError);
                  setUserProfile(null);
                } else {
                  setUserProfile(profile);
                  // Set role based on profile data
                  if (profile?.role === "admin") {
                    setUserRole("admin");
                  }
                }
              } catch (err) {
                if (!mounted) return;
                console.error("Profile fetch error:", err);
                setUserProfile(null);
              }
            }, 100); // Small delay to avoid conflicts
          } else {
            setUserRole(null);
            setUserProfile(null);
          }
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Session initialization error:", error);
        setError(error.message);
        setUser(null);
        setUserRole(null);
        setUserProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          setUserRole("user"); // Default to user, will update after profile fetch

          // Fetch user profile data with delay to avoid conflicts
          profileFetchTimeout = setTimeout(async () => {
            if (!mounted) return;

            try {
              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

              if (!mounted) return;

              if (profileError) {
                console.error("Profile fetch error:", profileError);
                setUserProfile(null);
              } else {
                setUserProfile(profile);
                // Set role based on profile data
                if (profile?.role === "admin") {
                  setUserRole("admin");
                }
              }
            } catch (err) {
              if (!mounted) return;
              console.error("Profile fetch error:", err);
              setUserProfile(null);
            }
          }, 100); // Small delay to avoid conflicts
        } else {
          setUserRole(null);
          setUserProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      if (profileFetchTimeout) {
        clearTimeout(profileFetchTimeout);
      }
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const toggleMenu = () => setMenuOpen((open) => !open);

  // Get the correct profile URL based on user role
  const getProfileUrl = () => {
    if (!user) return "/login";
    return userRole === "admin" ? "/admin/" : "/users/profile";
  };

  // Render user avatar or icon
  const renderUserIcon = () => {
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
  };

  return (
    <div className={styles.navbarFixedBg}>
      <div className={styles.container}>
        <Logo />

        {/* Centered menu links */}
        <nav className={styles.centerNav}>
          <div className={styles.linksWrapper}>
            {navLinks.map((link) => (
              <Link key={link.id} href={link.url} className={styles.link}>
                {link.title}
              </Link>
            ))}
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
              {user && userProfile?.avatar_url ? (
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
