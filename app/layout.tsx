import Providers from "@/providers";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/utils/classNames";
import "./globals.css";
import { Viewport } from "next";
import { getSEOTags } from "@/lib/seo";
import config from "@/config";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSEOTags() function.
export const metadata = getSEOTags();

export const viewport: Viewport = {
	// Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme={config.colors.theme} className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          inter.variable,
          geistSans.variable,
          geistMono.variable,
          "antialiased"
        )}
      >
        {/* ContentSquare UX Analytics */}
        <Script
          id="contentsquare-uxa"
          src="https://t.contentsquare.net/uxa/68a44620984f2.js"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
