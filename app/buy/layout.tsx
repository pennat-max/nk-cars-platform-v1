import type { Metadata } from "next";
import "../buying-browser/buying-browser.css";

export const metadata: Metadata = {
  title: "NK Cars Buying Browser Preview",
  description: "Private mobile-first preview for finding and buying vehicles in Thailand through NK Cars.",
};

export default function BuyingBrowserLayout({ children }: { children: React.ReactNode }) {
  return children;
}
