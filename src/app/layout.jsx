import "./globals.css";
import Navbar from "@/components/Nav/Navbar";
import Footer from "@/components/Footer/Footer";
import ToastContainer from "@/components/Toast/ToastContainer";
import { getSiteUrl, siteDefaults } from "@/lib/seo/site";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthSessionProvider } from "@/context/AuthSessionContext";
import NotificationProviderBoundary from "@/components/NotificationProviderBoundary/NotificationProviderBoundary";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import ScrollToTop from "@/components/ScrollToTop/ScrollToTop";
import ScrollReset from "@/components/ScrollReset/ScrollReset";
import { Unbounded, Montserrat } from "next/font/google";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "900"],
  display: "swap",
  variable: "--font-unbounded",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-montserrat",
});

const base = getSiteUrl();

export const metadata = {
  metadataBase: new URL(base),
  title: {
    default: siteDefaults.authorName,
    template: `%s | ${siteDefaults.authorName}`,
  },
  description: siteDefaults.description,
  applicationName: siteDefaults.authorName,
  authors: [{ name: siteDefaults.authorName, url: base }],
  creator: siteDefaults.authorName,
  publisher: siteDefaults.authorName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", rel: "shortcut icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    canonical: base,
  },
  openGraph: {
    type: "website",
    locale: siteDefaults.locale,
    url: base,
    siteName: siteDefaults.authorName,
    title: siteDefaults.shortTitle,
    description: siteDefaults.description,
    images: [
      {
        url: "/images/share.png",
        width: 1200,
        height: 630,
        alt: `${siteDefaults.authorName} — Web Developer & Distance Runner`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteDefaults.shortTitle,
    description: siteDefaults.description,
    images: ["/images/share.png"],
    creator: siteDefaults.twitterCreator,
    site: siteDefaults.twitterSite,
  },
  other: {
    "google-site-verification": siteDefaults.googleSiteVerification,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

const rootJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: siteDefaults.authorName,
      url: base,
      description: siteDefaults.description,
      inLanguage: "en-US",
      publisher: { "@id": `${base}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${base}/#person`,
      name: siteDefaults.authorName,
      url: base,
      image: `${base}/images/me.jpg`,
      sameAs: [
        "https://github.com/nahednakib",
        "https://linkedin.com/in/nahednakib",
        "https://twitter.com/nahednakib",
      ],
      jobTitle: "Runner & Web Developer",
      knowsAbout: [
        "Web Development",
        "React",
        "Next.js",
        "JavaScript",
        "Distance Running",
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${montserrat.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(rootJsonLd),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthSessionProvider>
            <NotificationProviderBoundary>
              <Navbar />
              <div className="mainContainer">
                <div className="contentArea">{children}</div>
                <Footer />
              </div>
              <ToastContainer />
              <ScrollReset />
              <ScrollToTop />
              <SpeedInsights />
              <Analytics />
            </NotificationProviderBoundary>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
