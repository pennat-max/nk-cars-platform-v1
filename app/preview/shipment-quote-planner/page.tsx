import { redirect } from "next/navigation";

export const metadata = {
  title: "NK Cars Shipment Quote Planner Preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ShipmentQuotePlannerPreviewPage() {
  redirect("/nk-shipment-quote-planner-preview.html");
}
