import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import ActionBar from "@/components/ActionBar/ActionBar";
import EngagementSection from "@/components/EngagementSection/EngagementSection";
import ViewTracker from "./ViewTracker";
import { FaFolder, FaCalendar, FaUser, FaCheckCircle } from "react-icons/fa";
import {
  buildCreativeWorkJsonLd,
  buildPortfolioMetadata,
} from "@/lib/seo/portfolio-meta";
import { notFound, redirect } from "next/navigation";
import { isUuid } from "@/lib/utils/isUuid";

// ─── Data Loader (shared between generateMetadata and Page) ───────────────────

async function loadPortfolio(slug) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // Try by slug first
  let { data: portfolio, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { portfolio: null, error };

  // If not found by slug, try by UUID (old links)
  if (!portfolio && isUuid(slug)) {
    const { data: byId, error: byIdError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("id", slug)
      .maybeSingle();

    if (byIdError) return { portfolio: null, error: byIdError };
    if (byId?.slug)
      return { portfolio: byId, redirectTo: `/portfolio/${byId.slug}` };
  }

  return { portfolio, error: null };
}

// ─── Engagement Counts ────────────────────────────────────────────────────────

async function fetchPortfolioEngagementCounts(portfolioId) {
  if (!portfolioId) return { viewsCount: 0, likesCount: 0 };
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [viewsResult, likesResult] = await Promise.all([
    supabase
      .from("user_views")
      .select("*", { count: "exact", head: true })
      .eq("content_type", "portfolio")
      .eq("content_id", portfolioId),
    supabase
      .from("user_likes")
      .select("*", { count: "exact", head: true })
      .eq("content_type", "portfolio")
      .eq("content_id", portfolioId),
  ]);

  return {
    viewsCount: viewsResult.count ?? 0,
    likesCount: likesResult.count ?? 0,
  };
}

// ─── Related Projects ─────────────────────────────────────────────────────────

async function fetchRelatedProjects(portfolio, technologies) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: allProjects, error } = await supabase
      .from("portfolios")
      .select("id, title, slug, description, image, category, technologies, created_at")
      .neq("id", portfolio.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !allProjects) return [];

    const categoryProjects = allProjects.filter(
      (p) =>
        p.category &&
        portfolio.category &&
        p.category.toLowerCase() === portfolio.category.toLowerCase(),
    );

    const techProjects = allProjects.filter((p) => {
      if (!p.technologies || !technologies.length) return false;
      const pTechs = p.technologies.toLowerCase();
      return technologies.some((t) => pTechs.includes(t.toLowerCase()));
    });

    const combined = [...categoryProjects];
    techProjects.forEach((p) => {
      if (!combined.find((c) => c.id === p.id)) combined.push(p);
    });

    if (combined.length < 3) {
      allProjects.forEach((p) => {
        if (combined.length >= 3) return;
        if (!combined.find((c) => c.id === p.id)) combined.push(p);
      });
    }

    return combined.slice(0, 3);
  } catch (e) {
    console.error("Error fetching related projects:", e);
    return [];
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { portfolio } = await loadPortfolio(slug);

  if (!portfolio) {
    return {
      title: "Project Not Found",
      description: "This portfolio project could not be found.",
    };
  }

  return buildPortfolioMetadata({ portfolio });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString) {
  if (!dateString) return "Recent";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recent";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconFile() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconGithub() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>{icon}</div>
        <span className={styles.cardTitle}>{title}</span>
        <div className={styles.cardLine} />
      </div>
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PortfolioPage({ params }) {
  const { slug } = await params;
  const { portfolio, error, redirectTo } = await loadPortfolio(slug);

  if (redirectTo) redirect(redirectTo);
  if (error) return <p>Error: {error.message}</p>;
  if (!portfolio) notFound();

  const { viewsCount, likesCount } = await fetchPortfolioEngagementCounts(
    portfolio.id,
  );

  const technologies = portfolio.technologies
    ? portfolio.technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const relatedProjects = await fetchRelatedProjects(portfolio, technologies);

  const portfolioJsonLd = buildCreativeWorkJsonLd({ portfolio });
  const hasLinks =
    (portfolio.live_url && portfolio.live_url.trim()) ||
    (portfolio.repo_url && portfolio.repo_url.trim());
  const hasAchievements =
    portfolio.achievements && portfolio.achievements.trim();
  const hasKeyFeatures =
    portfolio.key_features && portfolio.key_features.trim();

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioJsonLd) }}
      />
      <ViewTracker portfolioId={portfolio.id} />

      {/* ── HERO ── */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        <div className={styles.heroContent}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <a href="/" className={styles.bcLink}>
              Home
            </a>
            <span className={styles.bcSep}>/</span>
            <a href="/portfolio" className={styles.bcLink}>
              Portfolio
            </a>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcActive}>{portfolio.title}</span>
          </nav>
          <div className={styles.heroAccentLine} />
          <h1 className={styles.heroTitle}>{portfolio.title}</h1>
          {portfolio.category && (
            <p className={styles.heroSub}>{portfolio.category}</p>
          )}
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>{viewsCount}</span>
              <span className={styles.heroStatKey}>Views</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>{likesCount}</span>
              <span className={styles.heroStatKey}>Likes</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal}>
                {portfolio.created_at
                  ? new Date(portfolio.created_at).getFullYear()
                  : "—"}
              </span>
              <span className={styles.heroStatKey}>Year</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div className={styles.layout}>
        <div className={styles.mainColWrap}>
          <div className={styles.mainColPrimary}>
            <SectionCard icon={<IconFile />} title="Project Overview">
              <div
                className={styles.prose}
                dangerouslySetInnerHTML={{ __html: portfolio.overview || "" }}
              />
            </SectionCard>

            {hasAchievements && (
              <SectionCard icon={<IconTrophy />} title="Achievements">
                <div
                  className={styles.prose}
                  dangerouslySetInnerHTML={{ __html: portfolio.achievements }}
                />
              </SectionCard>
            )}

            {hasKeyFeatures && (
              <SectionCard icon={<IconKey />} title="Key Features">
                <div
                  className={styles.prose}
                  dangerouslySetInnerHTML={{ __html: portfolio.key_features }}
                />
              </SectionCard>
            )}
          </div>

          <div className={styles.engagementWrap}>
            <EngagementSection
              id="comments-section"
              contentId={portfolio.id}
              contentType="portfolio"
            />
          </div>

          {relatedProjects.length > 0 && (
            <section className={styles.relatedSection}>
              <h2>Related Projects</h2>
              <ul className={styles.relatedList}>
                {relatedProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      className={styles.relatedListItem}
                      href={`/portfolio/${project.slug}`}
                    >
                      <Image
                        className={styles.relatedPostThumb}
                        src={project.image || "/images/portfolio.jpg"}
                        alt={project.title}
                        width={48}
                        height={48}
                      />
                      <div className={styles.relatedPostInfo}>
                        <span className={styles.relatedPostTitle}>
                          {project.title}
                        </span>
                        <span className={styles.relatedPostDesc}>
                          {project.description || "View this portfolio project..."}
                        </span>
                      </div>
                      <span className={styles.relatedReadMore}>
                        View Project <span className={styles.arrow}>→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <div className={styles.sidebarProjectInfo}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <IconBriefcase />
                  </div>
                  <span className={styles.cardTitle}>Project Info</span>
                  <div className={styles.cardLine} />
                </div>
                <div className={styles.cardBody}>
                  <ul className={styles.infoList}>
                    <li className={styles.infoRow}>
                      <div className={styles.infoIco}>
                        <FaFolder
                          style={{
                            color: "var(--primary-color)",
                            fontSize: "13px",
                          }}
                        />
                      </div>
                      <div>
                        <p className={styles.infoKey}>Category</p>
                        <p className={styles.infoVal}>{portfolio.category}</p>
                      </div>
                    </li>
                    <li className={styles.infoRow}>
                      <div className={styles.infoIco}>
                        <FaCalendar
                          style={{
                            color: "var(--primary-color)",
                            fontSize: "13px",
                          }}
                        />
                      </div>
                      <div>
                        <p className={styles.infoKey}>Date</p>
                        <p className={styles.infoVal}>
                          {formatDate(portfolio.created_at)}
                        </p>
                      </div>
                    </li>
                    {portfolio.client && (
                      <li className={styles.infoRow}>
                        <div className={styles.infoIco}>
                          <FaUser
                            style={{
                              color: "var(--primary-color)",
                              fontSize: "13px",
                            }}
                          />
                        </div>
                        <div>
                          <p className={styles.infoKey}>Client</p>
                          <p className={styles.infoVal}>{portfolio.client}</p>
                        </div>
                      </li>
                    )}
                    <li className={`${styles.infoRow} ${styles.infoRowLast}`}>
                      <div className={styles.infoIco}>
                        <FaCheckCircle
                          style={{
                            color: "var(--primary-color)",
                            fontSize: "13px",
                          }}
                        />
                      </div>
                      <div>
                        <p className={styles.infoKey}>Status</p>
                        <p
                          className={`${styles.infoVal} ${styles.infoValAccent}`}
                        >
                          {portfolio.status || "Completed"}
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className={styles.actionBarWrap}>
                  <ActionBar
                    title={portfolio.title}
                    contentType="portfolio"
                    contentId={portfolio.id}
                  />
                </div>
              </div>
            </div>

            {(technologies.length > 0 || hasLinks) && (
              <div className={styles.sidebarTail}>
                {technologies.length > 0 && (
                  <SectionCard icon={<IconCode />} title="Tech Stack">
                    <div className={styles.techWrap}>
                      {technologies.map((tech, i) => (
                        <span key={i} className={styles.techTag}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {hasLinks && (
                  <SectionCard icon={<IconLink />} title="Links">
                    <div className={styles.linkBtns}>
                      {portfolio.live_url && portfolio.live_url.trim() && (
                        <a
                          href={portfolio.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.linkBtn} ${styles.linkBtnGhost}`}
                        >
                          <IconGlobe />
                          Live Website
                        </a>
                      )}
                      {portfolio.repo_url && portfolio.repo_url.trim() && (
                        <a
                          href={portfolio.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.linkBtn} ${styles.linkBtnGhost}`}
                        >
                          <IconGithub />
                          View Repository
                        </a>
                      )}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

    </div>
  );
}
