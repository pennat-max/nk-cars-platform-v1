"use client";

import BuyingBrowserShell from "./components/BuyingBrowserShell";
import { BuyingBrowserProvider } from "./BuyingBrowserProvider";
import AskScreen from "./screens/AskScreen";
import BrowseScreen from "./screens/BrowseScreen";
import { AccountScreen, CaseDetailScreen, CasesScreen, InspectionsScreen, MessagesScreen } from "./screens/CaseScreens";
import PasteScreen from "./screens/PasteScreen";
import SourceLaunchScreen from "./screens/SourceLaunchScreen";
import VehicleScreen from "./screens/VehicleScreen";
import WebBrowserScreen from "./screens/WebBrowserScreen";
import type { BuyingBrowserView, CustomerIdentity, CustomerListing, SourceAdapterStatus } from "./types";

export default function BuyingBrowserApp({
  view,
  sourceId,
  caseId,
  customer,
  sourceStatus,
  listings,
}: {
  view: BuyingBrowserView;
  sourceId?: string;
  caseId?: string;
  customer: CustomerIdentity;
  sourceStatus: SourceAdapterStatus;
  listings: CustomerListing[];
}) {
  return (
    <BuyingBrowserProvider customer={customer} sourceStatus={sourceStatus} initialListings={listings}>
      <BuyingBrowserShell view={view}>
        {view === "source" && <SourceLaunchScreen />}
        {view === "web-browser" && <WebBrowserScreen />}
        {view === "browse" && <BrowseScreen />}
        {view === "saved" && <BrowseScreen savedOnly />}
        {view === "vehicle" && <VehicleScreen sourceId={sourceId} />}
        {view === "paste" && <PasteScreen />}
        {view === "share" && <PasteScreen autoCapture />}
        {view === "ask" && <AskScreen />}
        {view === "cases" && <CasesScreen />}
        {view === "case" && <CaseDetailScreen caseId={caseId} />}
        {view === "inspections" && <InspectionsScreen />}
        {view === "messages" && <MessagesScreen />}
        {view === "account" && <AccountScreen />}
      </BuyingBrowserShell>
    </BuyingBrowserProvider>
  );
}
