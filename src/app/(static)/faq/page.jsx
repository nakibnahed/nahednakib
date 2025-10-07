"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageSquare,
  Mail,
  Search,
  Zap,
  Shield,
  Users,
  Code,
  Target,
  Heart,
} from "lucide-react";
import styles from "./faq.module.css";

export default function FAQPage() {
  const [openItems, setOpenItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Questions", icon: HelpCircle },
    { id: "general", label: "General", icon: MessageSquare },
    { id: "technical", label: "Technical", icon: Code },
    { id: "features", label: "Features", icon: Zap },
    { id: "account", label: "Account", icon: Users },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "support", label: "Support", icon: Heart },
  ];

  const faqData = [
    {
      id: 1,
      category: "general",
      question: "What is the Running Programmer platform?",
      answer:
        "The Running Programmer platform is a unique combination of my personal journey as a distance runner and web developer. It showcases my portfolio, blog about running and programming, and provides resources for fellow developers and runners who share similar passions.",
    },
    {
      id: 2,
      category: "general",
      question: "Who is Nahed Nakib?",
      answer:
        "I'm Nahed Nakib, a professional distance runner and web developer. I bring the same dedication, focus, and precision from the track to building high-performance websites. My unique combination of athletic discipline and coding expertise sets me apart as a developer who understands both performance and precision.",
    },
    {
      id: 3,
      category: "features",
      question: "What features are available on the platform?",
      answer:
        "The platform includes my portfolio showcasing development projects, a blog covering both running and programming topics, running settings and analytics, user engagement features like comments and likes, newsletter subscription, and contact forms for collaboration opportunities.",
    },
    {
      id: 4,
      category: "technical",
      question: "What technologies power this platform?",
      answer:
        "The platform is built using Next.js 14 with React, Supabase for backend services, modern CSS with glass morphism effects, and follows responsive design principles. It's optimized for performance and accessibility across all devices.",
    },
    {
      id: 5,
      category: "account",
      question: "Do I need to create an account to use the platform?",
      answer:
        "No account is required to browse the portfolio, read blog posts, or view running content. However, creating an account allows you to comment on posts, like content, save preferences, and access personalized features.",
    },
    {
      id: 6,
      category: "account",
      question: "How do I create an account?",
      answer:
        "You can create an account by clicking the 'Register' button in the navigation menu. Simply provide your email address and create a secure password. You'll receive a confirmation email to verify your account.",
    },
    {
      id: 7,
      category: "features",
      question: "How can I track my running progress?",
      answer:
        "The running settings feature allows you to input your running data, track progress over time, and view analytics. You can set goals, log workouts, and monitor your improvement in various running metrics.",
    },
    {
      id: 8,
      category: "technical",
      question: "Is the platform mobile-friendly?",
      answer:
        "Absolutely! The platform is fully responsive and optimized for mobile devices. You'll have the same great experience whether you're using a desktop, tablet, or smartphone.",
    },
    {
      id: 9,
      category: "privacy",
      question: "How is my personal information protected?",
      answer:
        "We take privacy seriously. All personal information is encrypted, stored securely, and never shared with third parties without your consent. You can read our detailed Privacy Policy for more information about data protection measures.",
    },
    {
      id: 10,
      category: "support",
      question: "How can I get in touch for support or collaboration?",
      answer:
        "You can reach out through the Contact page, send feedback via the Feedback form, or email me directly. I typically respond within 24-48 hours and am always interested in hearing about collaboration opportunities.",
    },
    {
      id: 11,
      category: "features",
      question: "Can I subscribe to updates and newsletters?",
      answer:
        "Yes! You can subscribe to our newsletter to receive updates about new blog posts, running tips, programming insights, and platform improvements. You can manage your subscription preferences at any time.",
    },
    {
      id: 12,
      category: "technical",
      question: "What browsers are supported?",
      answer:
        "The platform works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.",
    },
    {
      id: 13,
      category: "features",
      question: "Can I comment on blog posts and portfolio items?",
      answer:
        "Yes! Registered users can comment on blog posts and portfolio items. Comments are moderated to maintain a positive and constructive community environment.",
    },
    {
      id: 14,
      category: "general",
      question: "Is the content regularly updated?",
      answer:
        "Yes, I regularly update the platform with new blog posts about running and programming, portfolio projects, and running analytics. You can subscribe to notifications to stay updated with the latest content.",
    },
    {
      id: 15,
      category: "support",
      question: "Do you offer web development services?",
      answer:
        "Yes! As a professional web developer, I offer custom web development services. If you're interested in working together on a project, please reach out through the Contact page with details about your requirements.",
    },
    {
      id: 16,
      category: "technical",
      question: "How fast is the platform?",
      answer:
        "The platform is optimized for speed with server-side rendering, optimized images, and efficient code. We use modern web technologies and best practices to ensure fast loading times and smooth user experience.",
    },
    {
      id: 17,
      category: "features",
      question: "Can I save articles or posts for later reading?",
      answer:
        "Currently, you can like posts to show appreciation. We're working on a bookmarking feature that will allow you to save articles for later reading. Stay tuned for updates!",
    },
    {
      id: 18,
      category: "privacy",
      question: "Do you use cookies?",
      answer:
        "Yes, we use cookies to enhance your experience, remember your preferences, and analyze site usage. You can control cookie settings through your browser. See our Privacy Policy for detailed information about our cookie usage.",
    },
  ];

  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div className={styles.container}>
      <div className={styles.faqCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Frequently Asked Questions</h1>
          <p className={styles.description}>
            Find answers to common questions about the Running Programmer
            platform, features, and services. Can't find what you're looking
            for?
            <a href="/contact" className={styles.contactLink}>
              {" "}
              Contact us
            </a>
            !
          </p>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.categories}>
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                className={`${styles.categoryButton} ${
                  selectedCategory === category.id ? styles.categoryActive : ""
                }`}
                onClick={() => handleCategoryChange(category.id)}
              >
                <IconComponent size={18} />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.resultsInfo}>
          <p className={styles.resultsCount}>
            {filteredFAQs.length} question{filteredFAQs.length !== 1 ? "s" : ""}{" "}
            found
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory !== "all" &&
              ` in ${categories.find((c) => c.id === selectedCategory)?.label}`}
          </p>
        </div>

        <div className={styles.faqList}>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => {
              const isOpen = openItems.has(faq.id);
              return (
                <div key={faq.id} className={styles.faqItem}>
                  <button
                    className={`${styles.faqQuestion} ${
                      isOpen ? styles.faqQuestionOpen : ""
                    }`}
                    onClick={() => toggleItem(faq.id)}
                  >
                    <div className={styles.questionContent}>
                      <span className={styles.questionText}>
                        {faq.question}
                      </span>
                      <div className={styles.questionMeta}>
                        <span className={styles.categoryTag}>
                          {categories.find((c) => c.id === faq.category)?.label}
                        </span>
                      </div>
                    </div>
                    <div className={styles.chevron}>
                      {isOpen ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </div>
                  </button>
                  <div
                    className={`${styles.faqAnswer} ${
                      isOpen ? styles.faqAnswerOpen : ""
                    }`}
                  >
                    <div className={styles.answerContent}>
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noResults}>
              <HelpCircle size={48} className={styles.noResultsIcon} />
              <h3 className={styles.noResultsTitle}>No questions found</h3>
              <p className={styles.noResultsText}>
                Try adjusting your search terms or browse all categories.
              </p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.helpSection}>
            <h3 className={styles.helpTitle}>Still need help?</h3>
            <p className={styles.helpText}>
              Can't find the answer you're looking for? We're here to help!
            </p>
            <div className={styles.helpActions}>
              <a href="/contact" className={styles.helpButton}>
                <Mail size={18} />
                Contact Us
              </a>
              <a href="/feedback" className={styles.helpButtonSecondary}>
                <MessageSquare size={18} />
                Send Feedback
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
