"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import styles from "./TableOfContents.module.css";

const TocContext = createContext(null);

function scrollToHeading(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const OFFSET = 80;
  const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

function useActiveHeading(headings) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? null);

  useEffect(() => {
    if (!headings?.length) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            id: e.target.id,
            top: e.boundingClientRect.top,
          }))
          .sort((a, b) => a.top - b.top);
        if (intersecting.length) {
          setActiveId(intersecting[0].id);
        }
      },
      {
        rootMargin: "-100px 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

/**
 * Wraps the blog post layout when a TOC should be shown (2+ headings).
 * @param {{ headings: Array<{ id: string; text: string; level: number }>; children: import('react').ReactNode }} props
 */
export function TableOfContentsProvider({ headings, children }) {
  const activeId = useActiveHeading(headings?.length >= 2 ? headings : []);
  const value =
    headings?.length >= 2
      ? { headings, activeId }
      : null;

  return (
    <TocContext.Provider value={value}>{children}</TocContext.Provider>
  );
}

function TocNavLinks({ className, navClassName }) {
  const ctx = useContext(TocContext);
  if (!ctx) return null;

  const { headings, activeId } = ctx;

  return (
    <nav
      className={navClassName}
      aria-label="Table of contents"
    >
      <p className={styles.tocTitle}>Table of contents</p>
      <ul className={className}>
        {headings.map((h) => (
          <li
            key={h.id}
            className={
              h.level === 3 ? styles.itemH3 : styles.itemH2
            }
          >
            <button
              type="button"
              className={
                activeId === h.id ? styles.linkActive : styles.link
              }
              onClick={() => scrollToHeading(h.id)}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Sticky sidebar TOC — visible from 1200px up. */
export function TableOfContentsDesktop() {
  const ctx = useContext(TocContext);
  if (!ctx) return null;
  return (
    <TocNavLinks
      navClassName={`${styles.sidebar} ${styles.desktopOnly}`}
      className={styles.list}
    />
  );
}

/** Collapsible TOC — visible below 1200px, between featured image and article body. */
export function TableOfContentsMobile() {
  const ctx = useContext(TocContext);
  const [open, setOpen] = useState(false);
  if (!ctx) return null;
  const { headings, activeId } = ctx;

  return (
    <nav
      className={styles.collapsible}
      aria-label="Table of contents"
    >
      <button
        type="button"
        className={styles.collapsibleToggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="toc-collapsible-list"
      >
        <span>Table of contents</span>
        <span
          className={`${styles.collapsibleChevron} ${
            open ? styles.collapsibleChevronOpen : ""
          }`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open ? (
        <ul id="toc-collapsible-list" className={styles.collapsibleList}>
          {headings.map((h) => (
            <li
              key={h.id}
              className={h.level === 3 ? styles.itemH3 : styles.itemH2}
            >
              <button
                type="button"
                className={
                  activeId === h.id ? styles.linkActive : styles.link
                }
                onClick={() => {
                  scrollToHeading(h.id);
                  setOpen(false);
                }}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}
