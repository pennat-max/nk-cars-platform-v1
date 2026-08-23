import NKPlatform from "./NKPlatform";
import type { RouteTarget } from "./routeTargets";

export default function RouteShell(target: RouteTarget) {
  return <NKPlatform {...target} />;
}
