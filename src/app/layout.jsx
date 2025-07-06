import "./globals.css";
import Navbar from "@/components/Nav/Navbar";
import Footer from "@/components/Footer/Footer";
import ToastContainer from "@/components/Toast/ToastContainer";
import { metadata as siteMetadata } from "@/constants/metadata";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
  icons: {
    icon: siteMetadata.icons.icon,
  },
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.url,
    siteName: "Nahed",
    type: "website",
    images: [
      {
        url: siteMetadata.image,
        width: 1200,
        height: 630,
        alt: "Nahed - Web Developer & Runner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [siteMetadata.image],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Navbar />
          <div className="mainContainer">
            {children}
            <Footer />
          </div>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
