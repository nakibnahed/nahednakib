// app/layout.jsx
import "./globals.css";
import Navbar from "@/components/Nav/Navbar";
import Footer from "@/components/Footer/Footer";
import { ThemeProvider } from "@/context/ThemeContext";

import { metadata as siteMetadata } from "@/constants/metadata";

export const metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
  icons: {
    icon: siteMetadata.icons.icon,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>{siteMetadata.title}</title>
        <meta name="description" content={siteMetadata.description} />
        <link rel="icon" href={siteMetadata.icons.icon} />
      </head>
      <body>
        <ThemeProvider>
          <div className="animatedBg"></div>
          <div className="container">
            <Navbar />
            {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
