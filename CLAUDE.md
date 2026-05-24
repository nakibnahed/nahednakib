# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other AI assistants when working with code in this repository.

## Guidelines

- **No Git Commits or Pushes**: Never perform `git commit` or `git push` actions. All commits and pushes are strictly reserved for the user to perform.

- **Mobile-First Responsiveness — Mandatory on Every Edit**: Every change to UI, layout, or styling — no matter how small — MUST be fully responsive and deliver best-in-class UX/UI on mobile. This is non-negotiable and applies automatically without the user needing to ask. The user should never have to remind you about responsive design.

  **Breakpoints to always handle:**
  - Mobile: `max-width: 480px`
  - Tablet: `max-width: 768px`
  - Desktop: `min-width: 769px`

  **Rules that always apply:**
  1. **Touch targets** — buttons, links, and interactive elements must be at least `44px × 44px` on mobile.
  2. **No horizontal overflow** — never let content overflow the viewport width. Use `overflow-x: hidden` on containers if needed, but prefer fixing the root cause.
  3. **Readable text** — minimum `16px` body text on mobile to prevent browser zoom. Never shrink headings below `14px`.
  4. **Stacked layouts** — multi-column grids/flex rows must collapse to a single column on mobile (`flex-direction: column` or `grid-template-columns: 1fr`).
  5. **Padding & spacing** — reduce large desktop padding (`48px+`) to comfortable mobile values (`16px–24px`) inside `@media (max-width: 768px)`.
  6. **Images & media** — always `max-width: 100%` and appropriate `aspect-ratio` so they don't overflow.
  7. **Forms & inputs** — full-width (`width: 100%`) on mobile; avoid side-by-side fields that become too narrow.
  8. **Navigation & modals** — drawers, dropdowns, and modals must be usable on a 375px screen without pinch-zoom.
  9. **Admin pages** — the `/admin` section must also be responsive; tables should horizontally scroll or reflow to cards on small screens.
  10. **No fixed widths** — avoid `width: 600px` or similar fixed pixel widths on elements that live inside page flow; use `max-width` with `width: 100%` instead.

  **How to add mobile overrides in a CSS Module:**
  ```css
  /* Always append responsive overrides at the bottom of the .module.css file */

  /* ── Mobile ──────────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .container {
      padding: 16px;
    }
  }

  @media (max-width: 480px) {
    .title {
      font-size: 1.25rem;
    }
  }
  ```

## Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

There are no automated tests. Manual testing is done by running the dev server.

## Environment Variables

The following env vars are required (create a `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
TINYMCE_API_KEY=
```

## Architecture

**Personal portfolio site** for Nahed Nakib (runner & web developer), built with Next.js App Router, React 19, and Supabase as the full backend (database, auth, real-time, storage).

### Route Groups

- `src/app/(static)/` — pages with no dynamic data (about, contact, faq, training, showcase, etc.)
- `src/app/(dynamic)/` — pages requiring DB queries (blog, portfolio with `[slug]`, conversation-practice)
- `src/app/admin/` — admin-only CMS (blogs, portfolio, authors, categories, comments, newsletter, etc.)
- `src/app/api/` — API route handlers; all write operations require auth

### Supabase Client Strategy

Three separate clients are used depending on context:

| File | Usage |
|------|-------|
| `src/lib/supabase/client.ts` | Browser client (singleton), used in Client Components and hooks |
| `src/lib/supabase/server.js` | Server client via `@supabase/ssr` with cookie handling, used in Server Components and API routes |
| `src/lib/supabase/serviceRole.js` | Service role client (bypasses RLS), used only in API routes after explicit auth checks |
| `src/lib/supabase/anon-public.js` | Anonymous client for public reads, no auth context |

`src/lib/supabase/client.js` re-exports from `client.ts` — always import from `@/lib/supabase/client`.

### Auth & Authorization

- `AuthSessionContext` (`src/context/AuthSessionContext.jsx`) wraps the entire app and exposes `{ session, user, loading, initialized, isAuthenticated }` via `useAuthSession()`. It has an 8-second timeout and auto-recovery for invalid/expired sessions.
- Admin access is checked server-side in API routes by verifying `profiles.role === 'admin'` via the server Supabase client.
- The **main admin** (the only account that can manage authors) is hardcoded in `src/lib/auth/mainAdmin.js` (`requireMainAdmin()`). Other admin features only need `role === 'admin'` in the profiles table.
- Admin pages are wrapped in `<AdminAuthCheck>` which handles client-side redirect for unauthenticated users.

### Global Context Providers

Providers nest in this order in `src/app/layout.jsx`:
```
ThemeProvider → AuthSessionProvider → NotificationProviderBoundary → children
```

- `ThemeContext` — dark/light mode via `next-themes`
- `AuthSessionContext` — Supabase auth session state
- `NotificationContext` (`src/context/NotificationContext.jsx`) — real-time notifications via Supabase `postgres_changes` subscriptions, with optimistic UI, cursor-based pagination (20/page), and a 15s unread-count cache

### Content & Engagement System

Blog posts and portfolio items share a unified engagement model:
- **Tables**: `user_likes`, `user_favorites`, `user_views`, `comments`
- All keyed by `(content_type, content_id)` — `content_type` is either `"blog"` or `"portfolio"`
- `useEngagement(contentType, contentId)` hook handles likes, favorites, and comments with optimistic updates
- `useViews` hook (`src/hooks/useViews.js`) tracks page views
- `ActionBar` component renders the like/favorite/share controls used on both blog and portfolio detail pages
- `EngagementSection` component renders the full comments UI

### Portfolio Routing

Portfolio items are addressable by slug (`/portfolio/[slug]`). Old UUID-based URLs are handled via a redirect: if the slug is a valid UUID and no slug match is found, the DB is queried by ID and the user is redirected to the slug URL. See `src/app/(dynamic)/portfolio/[slug]/page.jsx`.

### SEO

All SEO utilities live in `src/lib/seo/`:
- `site.js` — canonical URL, site defaults (author, description, social handles)
- `blog.js` — blog-specific metadata and JSON-LD
- `portfolio-meta.js` — portfolio `generateMetadata` and `CreativeWork` JSON-LD
- `auto.js` — automatic metadata generation helpers

Site metadata defaults are in `src/constants/metadata.js` and `src/constants/mainAuthor.js`.

### Security Headers

Security headers (CSP, X-Frame-Options, etc.) are set in two places that must stay in sync:
- `next.config.mjs` — applied via Next.js headers config
- `src/middleware.js` — re-applied at the edge to override Vercel CDN headers; also enforces per-origin CORS for `/api/` routes only

### Styling

Pure CSS Modules — each component has a co-located `.module.css` file. No CSS-in-JS or utility frameworks. Global styles are in `src/app/globals.css`. Fonts are Unbounded and Montserrat loaded via `next/font/google` with CSS variables `--font-unbounded` and `--font-montserrat`.

### Dark & Light Theme — Mandatory Rules

The site uses `next-themes` which applies `class="light"` on `<html>` for light mode. Dark mode is the default (`:root`). **Every new component or page MUST support both modes.**

**CSS variables to always use (never hardcode colors):**

| Variable | Dark value | Light value | Use for |
|---|---|---|---|
| `--background-main` | `#0a0a0a` | `#f8fafc` | Page/shell backgrounds |
| `--card-bg` | `#1a1a1a` | `#ffffff` | Card backgrounds |
| `--card-border` | `#232329` | `#e5e7eb` | Borders |
| `--card-text` | `#f3f4f6` | `#11181c` | Card text |
| `--text-primary` | `#f3f4f6` | `#11181c` | Headings, titles |
| `--text-dark` | `#aaaaaa` | `#11181c` | Body text |
| `--text-muted` | `#aaaaaa` | `#6b7280` | Secondary/muted text |
| `--text-secondary` | `#71717a` | `#6b7280` | Labels, captions |
| `--form-control-bg` | semi-transparent dark | `#ffffff` | Input backgrounds |
| `--button-bg` | orange gradient | `#11181c` | Primary buttons |
| `--button-text` | `#222` | `#ffffff` | Primary button text |

**Patterns that break light mode — always fix:**

1. **Glassmorphism backgrounds** — `rgba(255, 255, 255, 0.05–0.15)` are invisible in light. Replace with `color-mix(in srgb, var(--card-border) 40%, transparent)` or a solid CSS variable.
2. **Hardcoded white text** — `color: #fff` or `color: white` outside of buttons/badges. Use `var(--text-primary)` or `var(--card-text)` instead.
3. **Hardcoded light-gray text** — `color: #ddd`, `#eee`, `#ccc`. Use `var(--text-muted)`.
4. **Dark mix backgrounds** — `color-mix(in srgb, #000 20%+, ...)` creates gray blobs in light mode. Anything above ~10% black needs a `:global(.light)` override.
5. **Sheen pseudo-elements** — `rgba(255, 255, 255, 0.02)` gradient overlays on `::after`. Add `:global(.light) .element::after { background: none; }`.
6. **Pink/pastel error text** — `color: #fecaca` or `#fca5a5` (invisible in light). Use `#dc2626` in light mode.
7. **Sidebar nav menus** — both admin and user sidebars use `color-mix(in srgb, #000 22%, transparent)` for `.menu`. Always add `:global(.light) .menu { background: color-mix(in srgb, var(--card-border) 40%, transparent); }`.
8. **Tooltips** — `.tooltip { background: var(--text-primary) }` flips to black-on-black in light. Always add `:global(.light) .tooltip { background: #ffffff; color: #11181c; }`.
9. **Layout shells & sidebars** — `color-mix(in srgb, var(--background-main) 92%, #000 8%)` is a common sidebar background that produces a visible gray in light mode. Always override: `:global(.light) .sidebarWrap { background: #ffffff; border-right-color: var(--card-border); }`.
10. **Semi-transparent cards** — `background: color-mix(in srgb, var(--background-main) 80%, transparent 15%)` creates washed-out gray cards in light mode. Override with `background: #ffffff` and a subtle box-shadow.

**How to add light mode overrides in a CSS Module:**

```css
/* Always append at the bottom of the .module.css file */

/* ── Light mode ──────────────────────────────────────────────── */
:global(.light) .card {
  background: #ffffff;
  border-color: var(--card-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:global(.light) .title {
  color: var(--text-primary);
}
```

**Do NOT use** `.light .selector` (without `:global()`) — CSS Modules will scope it and the override will not apply.**Do NOT use** `@media (prefers-color-scheme: dark)` for theming — the app uses class-based theming, not OS preference.

### Admin CMS

The admin section (`/admin`) is a full CMS for managing:
- Blog posts (TinyMCE rich text editor via `@tinymce/tinymce-react`)
- Portfolio projects
- Authors, categories, comments, contact submissions
- Newsletter subscribers
- User notifications
- Running settings (shown via Strava integration in `src/app/api/strava/route.js`)

### Key External Integrations

- **Supabase** — database, auth, storage, real-time
- **Strava API** — running activity data (`/api/strava`)
- **Upstash Redis** — rate limiting or caching
- **TinyMCE** — rich text editor for blog/portfolio content
- **Nodemailer** — contact form emails (`src/services/mailer.js`)
- **Vercel Analytics & Speed Insights** — injected in root layout
