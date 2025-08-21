import "./globals.css";
import Navbar from "@/components/Nav/Navbar";
import Footer from "@/components/Footer/Footer";
import ToastContainer from "@/components/Toast/ToastContainer";
import { metadata as siteMetadata } from "@/constants/metadata";
import { ThemeProvider } from "@/context/ThemeContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
  keywords: siteMetadata.keywords,
  authors: [{ name: siteMetadata.author }],
  creator: siteMetadata.author,
  publisher: siteMetadata.author,
  robots: siteMetadata.robots,
  viewport: siteMetadata.viewport,
  manifest: "/manifest.json",
  icons: {
    icon: siteMetadata.icons.icon,
    apple: siteMetadata.icons.apple,
  },
  alternates: {
    canonical: siteMetadata.canonical,
  },
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.url,
    siteName: siteMetadata.siteName,
    type: siteMetadata.type,
    locale: siteMetadata.locale,
    images: [
      {
        url: siteMetadata.image,
        width: 1200,
        height: 630,
        alt: "Nahed Nakib - Web Developer & Distance Runner",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [siteMetadata.image],
    creator: "@nahednakib",
    site: "@nahednakib",
  },
  other: {
    "google-site-verification": "your-verification-code-here", // Add your Google Search Console verification code
  },
};

// Structured data for better SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Nahed Nakib",
  url: "https://nahednakib.vercel.app",
  image: "https://nahednakib.vercel.app/images/me.jpg",
  sameAs: [
    "https://github.com/nahednakib",
    "https://linkedin.com/in/nahednakib",
    "https://twitter.com/nahednakib",
  ],
  jobTitle: "Running Programmer & Web Developer",
  worksFor: {
    "@type": "Organization",
    name: "Freelance",
  },
  description:
    "Nahed Nakib is a professional distance runner and web developer who combines athletic excellence with coding expertise. As a running programmer, I bring discipline and precision to both sports and technology.",
  knowsAbout: [
    "Web Development",
    "React",
    "Next.js",
    "JavaScript",
    "Distance Running",
    "Marathon Running",
    "Running Programming",
    "Athlete Developer",
    "Professional Running",
    "Software Development",
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "US",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Navbar />
          <div className="mainContainer">
            {children}
            <Footer />
          </div>
          <ToastContainer />
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
