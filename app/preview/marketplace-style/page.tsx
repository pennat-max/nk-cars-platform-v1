import { redirect } from "next/navigation";

export const metadata = {
  title: "NK Cars Marketplace Style Preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MarketplaceStylePreviewPage() {
  redirect("/nk-marketplace-style-preview.html");
}
