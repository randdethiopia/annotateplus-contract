import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Great_Vibes, Noto_Serif_Ethiopic } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoEthiopic = Noto_Serif_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "700"],
});

// Shared so the signing portal's live preview and the sealed PDF render the same
// hand. Loading it here means one font instance for both.
const signatureFont = Great_Vibes({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "R&D Group | AnnotatePlus Contract & Verification System",
  description: "Task-based worker agreement e-signing and Fayda ID verification platform.",
  icons: {
    icon: "/logo/rd-group-logo.png",
    shortcut: "/logo/rd-group-logo.png",
    apple: "/logo/rd-group-logo.png",
  },
};

// viewport-fit=cover is what makes env(safe-area-inset-*) non-zero on iOS —
// without it the signing portal's pinned CTA sits under the home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoEthiopic.variable} ${signatureFont.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
