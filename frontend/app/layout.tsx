import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geom = localFont({
  src: [
    {
      path: "../public/fonts/Geom/Geom-VariableFont_wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../public/fonts/Geom/Geom-Italic-VariableFont_wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-geom",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Globetrotter",
  description: "Globetrotter is a travel planning platform that allows you to plan your trips and share them with others.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geom.variable} font-sans antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
