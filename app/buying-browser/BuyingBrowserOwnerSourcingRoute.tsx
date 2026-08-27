import { requireOwnerUser } from "../chatgpt-auth";
import BuyingBrowserOwnerSourcing from "./BuyingBrowserOwnerSourcing";
import { readQnapSourcingAutomation } from "./qnap-sourcing";
import { unavailableSourcingAutomationSnapshot } from "./sourcing-automation";

export default async function BuyingBrowserOwnerSourcingRoute() {
  const owner = await requireOwnerUser("/buy/owner/sourcing");
  const snapshot = await readQnapSourcingAutomation(owner).catch(() => unavailableSourcingAutomationSnapshot());
  return <BuyingBrowserOwnerSourcing initialSnapshot={snapshot} />;
}
