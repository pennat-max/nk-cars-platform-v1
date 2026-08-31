import type { Metadata } from "next";
import "../buying-browser/buying-browser.css";
import "./hispeed.css";

export const metadata: Metadata = {
  title: "TAISHUAI AUTO Thailand Vehicle Export",
  description: "Source quality vehicles from Thailand through TAISHUAI AUTO.",
};

export default function HiSpeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
