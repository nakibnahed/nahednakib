import styles from "./page.module.css";
import Link from "next/link";
import ActionBar from "@/components/ActionBar/ActionBar";
import EngagementSection from "@/components/EngagementSection/EngagementSection";
import ViewTracker from "./ViewTracker";
import {
  buildCreativeWorkJsonLd,
  buildPortfolioMetadata,
} from "@/lib/seo/portfolio-meta";
import { notFound, redirect } from "next/navigation";
import { isUuid } from "@/lib/utils/isUuid";
import {
  Eye,
  Heart,
  Calendar,
  Briefcase,
  Folder,
  User,
  CircleCheckBig,
  Code,
  Link as LinkIcon,
  Globe,
  ArrowRight,
} from "lucide-react";

function IconGithub() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

// ─── Data Loader ──────────────────────────────────────────────────────────────

async function loadPortfolio(slug) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  let { data: portfolio, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { portfolio: null, error };

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
      .select("id, title, slug, category, technologies, created_at")
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

// ─── Narrative Section (bare numbered header + hairline + body) ───────────────

function NarrativeSection({ num, title, children }) {
  return (
    <section className={styles.nsec}>
      <div className={styles.nsecHead}>
        <span className={styles.nsecNum}>{num}</span>
        <h2 className={styles.nsecTitle}>{title}</h2>
        <span className={styles.nsecRule} />
      </div>
      <div className={styles.nsecBody}>{children}</div>
    </section>
  );
}

// ─── Glass Card (rail) ────────────────────────────────────────────────────────

function RailCard({ icon, title, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardIcon}>{icon}</span>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.cardRule} />
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

  const year = portfolio.project_date
    ? portfolio.project_date.split("-")[0]
    : portfolio.created_at
    ? new Date(portfolio.created_at).getFullYear()
    : null;

  const hasLiveUrl = portfolio.live_url && portfolio.live_url.trim();
  const hasRepoUrl = portfolio.repo_url && portfolio.repo_url.trim();
  const hasLinks = hasLiveUrl || hasRepoUrl;

  const hasProblemStatement =
    portfolio.problem_statement && portfolio.problem_statement.trim();
  const hasChallenges = portfolio.challenges && portfolio.challenges.trim();
  const hasAchievements =
    portfolio.achievements && portfolio.achievements.trim();
  const hasKeyFeatures =
    portfolio.key_features && portfolio.key_features.trim();

  let sectionNum = 1;

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioJsonLd) }}
      />
      <ViewTracker portfolioId={portfolio.id} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        <div className={styles.heroContent}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <a href="/" className={styles.bcLink}>Home</a>
            <span className={styles.bcSep}>/</span>
            <a href="/portfolio" className={styles.bcLink}>Portfolio</a>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcActive}>{portfolio.title}</span>
          </nav>

          <h1 className={styles.heroTitle}>{portfolio.title}</h1>

          {portfolio.description && (
            <p className={styles.heroLede}>{portfolio.description}</p>
          )}

          <div className={styles.heroMeta}>
            <span className={styles.heroMetaItem}>
              <Eye size={15} strokeWidth={2} />
              {viewsCount.toLocaleString()} views
            </span>
            <span className={styles.heroMetaDot} />
            <span className={styles.heroMetaItem}>
              <Heart size={15} strokeWidth={2} />
              {likesCount} likes
            </span>
            {year && (
              <>
                <span className={styles.heroMetaDot} />
                <span className={styles.heroMetaItem}>
                  <Calendar size={15} strokeWidth={2} />
                  {year}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTENT GRID ─────────────────────────────────────────────────── */}
      <div className={styles.layout}>

        {/* ── MAIN COLUMN ── */}
        <div className={styles.mainCol}>

          {/* Overview / Case */}
          <NarrativeSection
            num={String(sectionNum++).padStart(2, "0")}
            title="Overview"
          >
            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{
                __html: portfolio.overview || portfolio.content || "",
              }}
            />
          </NarrativeSection>

          {hasProblemStatement && (
            <NarrativeSection
              num={String(sectionNum++).padStart(2, "0")}
              title="The Problem"
            >
              <div
                className={styles.prose}
                dangerouslySetInnerHTML={{ __html: portfolio.problem_statement }}
              />
            </NarrativeSection>
          )}

          {hasChallenges && (
            <NarrativeSection
              num={String(sectionNum++).padStart(2, "0")}
              title="Challenges & Solutions"
            >
              <div
                className={styles.prose}
                dangerouslySetInnerHTML={{ __html: portfolio.challenges }}
              />
            </NarrativeSection>
          )}

          {hasAchievements && (
            <NarrativeSection
              num={String(sectionNum++).padStart(2, "0")}
              title="Achievements"
            >
              <div
                className={styles.prose}
                dangerouslySetInnerHTML={{ __html: portfolio.achievements }}
              />
            </NarrativeSection>
          )}

          {hasKeyFeatures && (
            <NarrativeSection
              num={String(sectionNum++).padStart(2, "0")}
              title="Key Features"
            >
              <div
                className={styles.keyFeaturesBody}
                dangerouslySetInnerHTML={{ __html: portfolio.key_features }}
              />
            </NarrativeSection>
          )}

          {/* Links — mobile only (hidden on desktop, shown below Key Features) */}
          {hasLinks && (
            <div className={styles.mobileLinksSection}>
              <div className={styles.nsecHead}>
                <span className={styles.nsecNum}>
                  <LinkIcon size={15} strokeWidth={2} color="var(--primary-color)" />
                </span>
                <h2 className={styles.nsecTitle}>Links</h2>
                <span className={styles.nsecRule} />
              </div>
              <div className={styles.linkBtns}>
                {hasLiveUrl && (
                  <a
                    href={portfolio.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.linkBtn} ${styles.linkBtnPrimary}`}
                  >
                    <Globe size={16} strokeWidth={2} />
                    <span>Live Website</span>
                  </a>
                )}
                {hasRepoUrl && (
                  <a
                    href={portfolio.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.linkBtn} ${styles.linkBtnGhost}`}
                  >
                    <IconGithub />
                    <span>View Repository</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Engagement */}
          <div className={styles.engageWrap}>
            <EngagementSection
              id="comments-section"
              contentId={portfolio.id}
              contentType="portfolio"
            />
          </div>

          {/* Related Projects */}
          {relatedProjects.length > 0 && (
            <section className={styles.related}>
              <h2 className={styles.relatedTitle}>Related Projects</h2>
              <ul className={styles.relatedList}>
                {relatedProjects.map((project, i) => (
                  <li key={project.id} className={styles.relatedItem}>
                    <Link
                      href={`/portfolio/${project.slug}`}
                      className={styles.relatedLink}
                    >
                      <span className={styles.relatedIndex}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.relatedInfo}>
                        <span className={styles.relatedName}>{project.title}</span>
                        <span className={styles.relatedCat}>
                          {project.category}
                          {project.created_at &&
                            ` · ${new Date(project.created_at).getFullYear()}`}
                        </span>
                      </span>
                      <span className={styles.relatedArrow}>
                        <ArrowRight size={18} strokeWidth={2} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── STICKY RAIL ── */}
        <aside className={styles.rail}>
          <div className={styles.railInner}>

            {/* Project Info */}
            <RailCard
              icon={<Briefcase size={18} strokeWidth={2} color="var(--primary-color)" />}
              title="Project Info"
            >
              <ul className={styles.infoList}>
                {portfolio.category && (
                  <li className={styles.infoRow}>
                    <span className={styles.infoIco}>
                      <Folder size={14} strokeWidth={2} color="var(--primary-color)" />
                    </span>
                    <span className={styles.infoKey}>Category</span>
                    <span className={styles.infoVal}>{portfolio.category}</span>
                  </li>
                )}
                <li className={styles.infoRow}>
                  <span className={styles.infoIco}>
                    <Calendar size={14} strokeWidth={2} color="var(--primary-color)" />
                  </span>
                  <span className={styles.infoKey}>Date</span>
                  <span className={styles.infoVal}>
                    {formatDate(portfolio.project_date || portfolio.created_at)}
                  </span>
                </li>
                {portfolio.client && (
                  <li className={styles.infoRow}>
                    <span className={styles.infoIco}>
                      <User size={14} strokeWidth={2} color="var(--primary-color)" />
                    </span>
                    <span className={styles.infoKey}>Client</span>
                    <span className={styles.infoVal}>{portfolio.client}</span>
                  </li>
                )}
                <li className={`${styles.infoRow} ${styles.infoRowLast}`}>
                  <span className={styles.infoIco}>
                    <CircleCheckBig size={14} strokeWidth={2} color="var(--primary-color)" />
                  </span>
                  <span className={styles.infoKey}>Status</span>
                  <span className={`${styles.infoVal} ${styles.infoValAccent}`}>
                    {portfolio.status || "Completed"}
                  </span>
                </li>
              </ul>
              <div className={styles.actionBarWrap}>
                <ActionBar
                  title={portfolio.title}
                  contentType="portfolio"
                  contentId={portfolio.id}
                />
              </div>
            </RailCard>

            {/* Tech Stack */}
            {technologies.length > 0 && (
              <RailCard
                icon={<Code size={18} strokeWidth={2} color="var(--primary-color)" />}
                title="Tech Stack"
              >
                <div className={styles.techWrap}>
                  {technologies.map((tech, i) => (
                    <span key={i} className={styles.techTag}>{tech}</span>
                  ))}
                </div>
              </RailCard>
            )}

            {/* Links — desktop only (hidden on mobile, moved inline after Key Features) */}
            {hasLinks && (
              <div className={styles.railLinksCard}>
                <RailCard
                  icon={<LinkIcon size={18} strokeWidth={2} color="var(--primary-color)" />}
                  title="Links"
                >
                  <div className={styles.linkBtns}>
                    {hasLiveUrl && (
                      <a
                        href={portfolio.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.linkBtn} ${styles.linkBtnPrimary}`}
                      >
                        <Globe size={16} strokeWidth={2} />
                        <span>Live Website</span>
                      </a>
                    )}
                    {hasRepoUrl && (
                      <a
                        href={portfolio.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.linkBtn} ${styles.linkBtnGhost}`}
                      >
                        <IconGithub />
                        <span>View Repository</span>
                      </a>
                    )}
                  </div>
                </RailCard>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}
