import HiSpeedRoute from "../../HiSpeedRoute";

export default async function HiSpeedCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <HiSpeedRoute view="case" caseId={caseId} />;
}
