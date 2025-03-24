import '../styles/globals.css';
import '@algolia/autocomplete-theme-classic';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "St-Cyr Thoughts",
  description: "A Sanity Studio for St-Cyr Thoughts and Writings",
};

const currentTheme : string = "dark";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${currentTheme}`}
        data-theme={currentTheme}
      >
        {children}
      </body>
    </html>
  );
}
