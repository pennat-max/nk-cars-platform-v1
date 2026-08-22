import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NK Cars Platform V1",
  description: "Private mobile-first control center for sourcing and exporting used vehicles from Thailand.",
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
