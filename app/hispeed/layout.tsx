import type { Metadata } from "next";
import "../buying-browser/buying-browser.css";
import "./hispeed.css";

export const metadata: Metadata = {
  title: "TAISHUAI AUTO Thailand Vehicle Export",
  description: "Source quality vehicles from Thailand through TAISHUAI AUTO.",
  openGraph: {
    title: "TAISHUAI AUTO Thailand Vehicle Export",
    description: "Source quality vehicles from Thailand through TAISHUAI AUTO.",
    url: "https://taishuaiauto.com",
    siteName: "TAISHUAI AUTO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TAISHUAI AUTO Thailand Vehicle Export",
    description: "Source quality vehicles from Thailand through TAISHUAI AUTO.",
  },
};

export default function HiSpeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
