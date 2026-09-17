export const dynamic = "force-dynamic";

type FrankfurterResponse = { date?: string; rates?: { THB?: number } };

const FALLBACK_MARKET_RATE = 34;

export async function GET() {
  let marketRate = FALLBACK_MARKET_RATE;
  let rateDate: string | null = null;
  let source = "NK fallback rate";
  let fallback = true;
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=THB", { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("fx_source_unavailable");
    const payload = await response.json() as FrankfurterResponse;
    const rate = Number(payload.rates?.THB);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("invalid_fx_rate");
    marketRate = rate;
    rateDate = payload.date || null;
    source = "Frankfurter / ECB reference data";
    fallback = false;
  } catch {}
  const customerRate = Math.ceil(marketRate) + 1;
  return Response.json({ base: "USD", quote: "THB", marketRate, customerRate, rule: "ceil(marketRate)+1", rateDate, source, fallback, fetchedAt: new Date().toISOString() }, { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
