import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NK Cars Platform V1",
  description: "Private mobile-first control center for sourcing and exporting used vehicles from Thailand.",
  openGraph: {
    title: "NK Cars Platform V1",
    description: "Source. Review. Publish. Sell.",
    url: "https://nk-cars-platform-v1.pennat.chatgpt.site",
    siteName: "NK Cars Platform V1",
    images: [{ url: "https://nk-cars-platform-v1.pennat.chatgpt.site/og.png", width: 1200, height: 630, alt: "NK Cars Platform V1" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NK Cars Platform V1",
    description: "Source. Review. Publish. Sell.",
    images: ["https://nk-cars-platform-v1.pennat.chatgpt.site/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
