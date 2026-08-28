import HiSpeedRoute from "../../../HiSpeedRoute";

export default async function HiSpeedPiPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <HiSpeedRoute view="pi" caseId={caseId} />;
}
