"use client";

import React, { useState } from "react";
import {
  Shield,
  Eye,
  Lock,
  Database,
  Mail,
  Calendar,
  CheckCircle,
} from "lucide-react";
import styles from "./privacy.module.css";

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "data-collection", label: "Data Collection", icon: Database },
    { id: "data-usage", label: "Data Usage", icon: Eye },
    { id: "data-protection", label: "Data Protection", icon: Lock },
    { id: "cookies", label: "Cookies", icon: Eye },
    { id: "user-rights", label: "Your Rights", icon: CheckCircle },
    { id: "contact", label: "Contact Us", icon: Mail },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className={styles.content}>
            <h2 className={styles.sectionTitle}>Privacy Policy Overview</h2>
            <p className={styles.intro}>
              At Nahed Nakib's Running Programmer platform, we are committed to
              protecting your privacy and ensuring the security of your personal
              information. This Privacy Policy explains how we collect, use, and
              safeguard your data when you use our services.
            </p>

            <div className={styles.highlightBox}>
              <h3 className={styles.highlightTitle}>Our Commitment</h3>
              <ul className={styles.commitmentList}>
                <li>
                  <CheckCircle size={16} />
                  We never sell your personal information to third parties
                </li>
                <li>
                  <CheckCircle size={16} />
                  We use industry-standard security measures to protect your
                  data
                </li>
                <li>
                  <CheckCircle size={16} />
                  You have full control over your personal information
                </li>
                <li>
                  <CheckCircle size={16} />
                  We are transparent about our data practices
                </li>
              </ul>
            </div>

            <h3 className={styles.subtitle}>Last Updated</h3>
            <p className={styles.lastUpdated}>
              <Calendar size={16} />
              This policy was last updated on January 5, 2025
            </p>
          </div>
        );

      case "data-collection":
        return (
          <div className={styles.content}>
            <h2 className={styles.sectionTitle}>Information We Collect</h2>

            <div className={styles.dataType}>
              <h3 className={styles.subtitle}>Personal Information</h3>
              <p>We collect information you provide directly to us, such as:</p>
              <ul className={styles.dataList}>
                <li>
                  Name and email address (when you contact us or subscribe)
                </li>
                <li>Profile information (if you create an account)</li>
                <li>
                  Running data and preferences (if you use our running features)
                </li>
                <li>Feedback and comments you submit</li>
                <li>Communication preferences</li>
              </ul>
            </div>

            <div className={styles.dataType}>
              <h3 className={styles.subtitle}>
                Automatically Collected Information
              </h3>
              <p>When you visit our website, we automatically collect:</p>
              <ul className={styles.dataList}>
                <li>IP address and browser information</li>
                <li>Pages visited and time spent on our site</li>
                <li>Device information (type, operating system)</li>
                <li>Referral source (how you found our website)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div className={styles.dataType}>
              <h3 className={styles.subtitle}>Third-Party Information</h3>
              <p>We may receive information from third-party services:</p>
              <ul className={styles.dataList}>
                <li>Social media platforms (if you connect your accounts)</li>
                <li>Analytics services (Google Analytics)</li>
                <li>Email service providers</li>
                <li>Payment processors (if applicable)</li>
              </ul>
            </div>
          </div>
        );

      case "data-usage":
        return (
          <div className={styles.content}>
            <h2 className={styles.sectionTitle}>How We Use Your Information</h2>

            <div className={styles.usageGrid}>
              <div className={styles.usageCard}>
                <h3 className={styles.subtitle}>Service Provision</h3>
                <ul className={styles.dataList}>
                  <li>Provide and maintain our services</li>
                  <li>Process your requests and transactions</li>
                  <li>Personalize your experience</li>
                  <li>Communicate with you about our services</li>
                </ul>
              </div>

              <div className={styles.usageCard}>
                <h3 className={styles.subtitle}>Improvement & Analytics</h3>
                <ul className={styles.dataList}>
                  <li>Analyze usage patterns and trends</li>
                  <li>Improve our website and services</li>
                  <li>Develop new features and functionality</li>
                  <li>Conduct research and analytics</li>
                </ul>
              </div>

              <div className={styles.usageCard}>
                <h3 className={styles.subtitle}>Communication</h3>
                <ul className={styles.dataList}>
                  <li>Send you important updates</li>
                  <li>Respond to your inquiries</li>
                  <li>Send newsletters (with your consent)</li>
                  <li>Provide customer support</li>
                </ul>
              </div>

              <div className={styles.usageCard}>
                <h3 className={styles.subtitle}>Legal Compliance</h3>
                <ul className={styles.dataList}>
                  <li>Comply with legal obligations</li>
                  <li>Protect our rights and interests</li>
                  <li>Prevent fraud and abuse</li>
                  <li>Enforce our terms of service</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "data-protection":
        return (
          <div className={styles.content}>
            <h2 className={styles.sectionTitle}>Data Protection & Security</h2>

            <div className={styles.protectionGrid}>
              <div className={styles.protectionCard}>
                <Lock size={24} className={styles.protectionIcon} />
                <h3 className={styles.subtitle}>Encryption</h3>
                <p>
                  All data is encrypted in transit and at rest using
                  industry-standard encryption protocols.
                </p>
              </div>

              <div className={styles.protectionCard}>
                <Shield size={24} className={styles.protectionIcon} />
                <h3 className={styles.subtitle}>Secure Infrastructure</h3>
                <p>
                  We use secure cloud infrastructure with regular security
                  audits and monitoring.
                </p>
              </div>

              <div className={styles.protectionCard}>
                <Database size={24} className={styles.protectionIcon} />
                <h3 className={styles.subtitle}>Access Controls</h3>
                <p>
                  Strict access controls ensure only authorized personnel can
                  access your data.
                </p>
              </div>

              <div className={styles.protectionCard}>
                <Eye size={24} className={styles.protectionIcon} />
                <h3 className={styles.subtitle}>Monitoring</h3>
                <p>
                  Continuous monitoring and logging to detect and prevent
                  unauthorized access.
                </p>
              </div>
            </div>

            <div className={styles.dataRetention}>
              <h3 className={styles.subtitle}>Data Retention</h3>
              <p>
                We retain your personal information only as long as necessary
                to:
              </p>
              <ul className={styles.dataList}>
                <li>Provide our services to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Improve our services</li>
              </ul>
              <p className={styles.retentionNote}>
                When data is no longer needed, we securely delete or anonymize
                it.
              </p>
            </div>
          </div>
        );

      case "cookies":
        return (
          <div className={styles.content}>
            <h2 className={styles.sectionTitle}>
              Cookies & Tracking Technologies
            </h2>

            <div className={styles.cookieInfo}>
              <p>
                We use cookies and similar tracking technologies to enhance your
                experience and analyze how you use our website.
              </p>
            </div>

            <div className={styles.cookieTypes}>
              <div className={styles.cookieType}>
                <h3 className={styles.subtitle}>Essential Cookies</h3>
                <p>
                  These cookies are necessary for the website to function
                  properly. They cannot be disabled.
                </p>
                <ul className={styles.dataList}>
                  <li>Authentication and session management</li>
                  <li>Security and fraud prevention</li>
                  <li>Basic website functionality</li>
                </ul>
              </div>

              <div className={styles.cookieType}>
                <h3 className={styles.subtitle}>Analytics Cookies</h3>
                <p>
                  These cookies help us understand how visitors interact with
                  our website.
                </p>
                <ul className={styles.dataList}>
                  <li>Google Analytics for usage statistics</li>
                  <li>Page views and user behavior tracking</li>
                  <li>Performance monitoring</li>
                </ul>
              </div>

              <div className={styles.cookieType}>
                <h3 className={styles.subtitle}>Preference Cookies</h3>
                <p>These cookies remember your preferences and settings.</p>
                <ul className={styles.dataList}>
                  <li>Theme preferences (dark/light mode)</li>
                  <li>Language settings</li>
                  <li>Customized user experience</li>
                </ul>
              </div>
            </div>

            <div className={styles.cookieControl}>
              <h3 className={styles.subtitle}>Cookie Management</h3>
              <p>
                You can control cookies through your browser settings. However,
                disabling certain cookies may affect the functionality of our
                website.
              </p>
            </div>
          </div>
        );

      case "user-rights":
        return (
          <div className={styles.content}>
            <h2 className={styles.sectionTitle}>Your Privacy Rights</h2>

            <div className={styles.rightsGrid}>
              <div className={styles.rightCard}>
                <CheckCircle size={24} className={styles.rightIcon} />
                <h3 className={styles.subtitle}>Access</h3>
                <p>
                  You have the right to request access to the personal
                  information we hold about you.
                </p>
              </div>

              <div className={styles.rightCard}>
                <CheckCircle size={24} className={styles.rightIcon} />
                <h3 className={styles.subtitle}>Correction</h3>
                <p>
                  You can request correction of inaccurate or incomplete
                  personal information.
                </p>
              </div>

              <div className={styles.rightCard}>
                <CheckCircle size={24} className={styles.rightIcon} />
                <h3 className={styles.subtitle}>Deletion</h3>
                <p>
                  You have the right to request deletion of your personal
                  information under certain circumstances.
                </p>
              </div>

              <div className={styles.rightCard}>
                <CheckCircle size={24} className={styles.rightIcon} />
                <h3 className={styles.subtitle}>Portability</h3>
                <p>
                  You can request a copy of your data in a structured,
                  machine-readable format.
                </p>
              </div>

              <div className={styles.rightCard}>
                <CheckCircle size={24} className={styles.rightIcon} />
                <h3 className={styles.subtitle}>Objection</h3>
                <p>
                  You can object to the processing of your personal information
                  for certain purposes.
                </p>
              </div>

              <div className={styles.rightCard}>
                <CheckCircle size={24} className={styles.rightIcon} />
                <h3 className={styles.subtitle}>Withdrawal</h3>
                <p>
                  You can withdraw consent for data processing at any time where
                  applicable.
                </p>
              </div>
            </div>

            <div className={styles.rightsProcess}>
              <h3 className={styles.subtitle}>How to Exercise Your Rights</h3>
              <p>
                To exercise any of these rights, please contact us using the
                information provided in the Contact section.
              </p>
              <ul className={styles.dataList}>
                <li>We will respond to your request within 30 days</li>
                <li>
                  We may need to verify your identity before processing your
                  request
                </li>
                <li>
                  Some rights may be limited by legal obligations or legitimate
                  interests
                </li>
              </ul>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className={styles.content}>
            <h2 className={styles.sectionTitle}>Contact Us About Privacy</h2>

            <div className={styles.contactInfo}>
              <p>
                If you have any questions about this Privacy Policy or our data
                practices, please don't hesitate to contact us.
              </p>
            </div>

            <div className={styles.contactMethods}>
              <div className={styles.contactMethod}>
                <Mail size={24} className={styles.contactIcon} />
                <h3 className={styles.subtitle}>Email</h3>
                <p>privacy@nahednakib.com</p>
              </div>

              <div className={styles.contactMethod}>
                <Calendar size={24} className={styles.contactIcon} />
                <h3 className={styles.subtitle}>Response Time</h3>
                <p>We typically respond within 24-48 hours</p>
              </div>
            </div>

            <div className={styles.privacyUpdates}>
              <h3 className={styles.subtitle}>Privacy Policy Updates</h3>
              <p>
                We may update this Privacy Policy from time to time. When we
                make significant changes, we will notify you through our website
                or by email.
              </p>
              <p>
                We encourage you to review this policy periodically to stay
                informed about how we protect your information.
              </p>
            </div>

            <div className={styles.legalInfo}>
              <h3 className={styles.subtitle}>Legal Basis</h3>
              <p>
                This Privacy Policy complies with applicable data protection
                laws, including GDPR, CCPA, and other relevant privacy
                regulations.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.privacyCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Privacy Policy</h1>
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.sidebar}>
            <nav className={styles.navigation}>
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    className={`${styles.navButton} ${
                      activeSection === section.id ? styles.navButtonActive : ""
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <IconComponent size={18} />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className={styles.mainContent}>{renderContent()}</div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            This privacy policy is effective as of January 5, 2025. We are
            committed to protecting your privacy and being transparent about our
            data practices.
          </p>
        </div>
      </div>
    </div>
  );
}
