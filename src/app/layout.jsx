"use client";

import "./globals.css";
import Navbar from "@/components/Nav/Navbar";
import Footer from "@/components/Footer/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import Head from "@/components/Head/Head";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head />
      <body>
        <ThemeProvider>
          <div className="animatedBg"></div> {/* ✅ Only Background remains */}
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
