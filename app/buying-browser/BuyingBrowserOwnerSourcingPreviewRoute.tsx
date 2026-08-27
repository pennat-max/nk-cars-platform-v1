import BuyingBrowserOwnerSourcing from "./BuyingBrowserOwnerSourcing";
import { unavailableSourcingAutomationSnapshot } from "./sourcing-automation";

export default function BuyingBrowserOwnerSourcingPreviewRoute() {
  return <BuyingBrowserOwnerSourcing initialSnapshot={unavailableSourcingAutomationSnapshot()} previewMode />;
}
