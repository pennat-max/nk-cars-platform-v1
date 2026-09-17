import type { Metadata } from "next";
import { headers } from "next/headers";
import "../buying-browser/buying-browser.css";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase() || "";
  const xiangshihai = host === "xiangshihai.com" || host === "www.xiangshihai.com";
  return xiangshihai
    ? { title: "Xiangshihai Vehicle Marketplace", description: "Source and buy vehicles in Thailand through Xiangshihai." }
    : { title: "NK Cars Buying Browser", description: "Find and buy vehicles in Thailand through NK Cars." };
}

export default function BuyingBrowserLayout({ children }: { children: React.ReactNode }) {
  return children;
}
