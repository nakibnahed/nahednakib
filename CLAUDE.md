# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other AI assistants when working with code in this repository.

## Guidelines

- **No Git Commits or Pushes**: Never perform `git commit` or `git push` actions. All commits and pushes are strictly reserved for the user to perform.

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
