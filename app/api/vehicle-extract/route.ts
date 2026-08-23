import { NextResponse } from "next/server";
import { sanitizeCustomerDescriptionEn } from "../../lib/domain";

export const runtime = "nodejs";

const fieldNames = [
  "brand", "model", "year", "grade", "engine", "engineCapacity", "transmission",
  "drive", "body", "cabType", "mileage", "color", "vinChassis", "registrationYear",
  "sourcePrice", "seller", "sourcePlatform", "listingText", "location", "customerDescriptionEn",
] as const;

const fieldSchema = {
  type: "object",
  properties: {
    value: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    status: { type: "string", enum: ["Extracted", "Need Review", "Conflict", "Unknown"] },
    evidence: { type: "array", items: { type: "string" } },
    alternatives: { type: "array", items: { type: "string" } },
  },
  required: ["value", "confidence", "status", "evidence", "alternatives"],
  additionalProperties: false,
};

const extractionSchema = {
  type: "object",
  properties: {
    fields: {
      type: "object",
      properties: Object.fromEntries(fieldNames.map((field) => [field, fieldSchema])),
      required: [...fieldNames],
      additionalProperties: false,
    },
    conflicts: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    image_count: { type: "number" },
  },
  required: ["fields", "conflicts", "summary", "image_count"],
  additionalProperties: false,
};

type ExtractionRequest = {
  images?: unknown;
  listingText?: unknown;
  sourceUrl?: unknown;
};

function isSupportedImage(value: string) {
  if (/^data:image\/(?:jpeg|jpg|png|webp);base64,/.test(value)) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host.endsWith(".fbcdn.net") || host.endsWith(".fbsbx.com") || host.endsWith(".facebook.com"));
  } catch {
    return false;
  }
}

const requestWindows = new Map<string, { count: number; resetAt: number }>();

function allowRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== new URL(request.url).host) return false; }
    catch { return false; }
  }
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const now = Date.now();
  const current = requestWindows.get(forwarded);
  if (!current || current.resetAt <= now) {
    requestWindows.set(forwarded, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (current.count >= 12) return false;
  current.count += 1;
  return true;
}

function outputText(response: Record<string, unknown>) {
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      if (part && typeof part === "object" && (part as { type?: unknown }).type === "output_text" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return "";
}

export async function POST(request: Request) {
  if (!allowRequest(request)) return NextResponse.json({ error: "มีการวิเคราะห์ถี่เกินไป กรุณารอแล้วลองใหม่" }, { status: 429 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 25 * 1024 * 1024) return NextResponse.json({ error: "ชุดรูปมีขนาดใหญ่เกิน 25 MB กรุณาลดจำนวนรูป" }, { status: 413 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "NK AI ยังไม่ได้เชื่อม API key บนระบบที่กำลังใช้งาน" }, { status: 503 });

  let body: ExtractionRequest;
  try {
    body = await request.json() as ExtractionRequest;
  } catch {
    return NextResponse.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  const images = Array.isArray(body.images)
    ? body.images.filter((image): image is string => typeof image === "string" && isSupportedImage(image)).slice(0, 30)
    : [];
  const listingText = typeof body.listingText === "string" ? body.listingText.slice(0, 30000) : "";
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.slice(0, 3000) : "";
  if (!images.length && !listingText.trim() && !sourceUrl.trim()) {
    return NextResponse.json({ error: "กรุณาส่งรูป ข้อความประกาศ หรือลิงก์อย่างน้อย 1 อย่าง" }, { status: 400 });
  }

  const instructions = `You are NK Cars Vehicle Extraction, an evidence-first vehicle intake specialist for used pickup exports from Thailand.
Analyze every supplied image jointly as ONE vehicle and combine it with listing text and source URL. Images may include exterior, rear, side, engine bay, cabin, dashboard/odometer, VIN or chassis plates, engine/spec stickers, grade badges, Facebook Marketplace screenshots, or listing screenshots.

Evidence priority (highest first):
1. Clearly visible official documents, VIN/chassis plates, manufacturer labels, or spec stickers.
2. Explicit listing text, including readable text inside screenshots.
3. Direct visual evidence such as badges, body/cab layout, controls, or odometer.
4. AI inference only when strongly supported, and it must be marked Need Review with lower confidence.

Rules:
- Never silently choose between conflicting sources. Set status Conflict, include every plausible value in alternatives, and explain the conflict in conflicts.
- Never guess. If evidence is absent, value must be "Unknown", confidence 0, status Unknown.
- If confidence is below 75 or evidence is indirect, use Need Review.
- Extract readable Marketplace title, price, year/model text, location, seller, and description into the appropriate fields.
- Preserve VIN/chassis exactly only when clearly readable. Do not reconstruct missing characters.
 - sourcePrice must contain digits only, without currency symbols or commas. Keep other values concise and human-readable.
 - customerDescriptionEn is a concise customer-facing English translation/summary of supported vehicle facts, specifications, features, and mileage. Never include source price, seller/dealer identity, seller contact, source platform, source URL, sourcing location, registration plate, full VIN/chassis, internal notes, or claims without evidence. Public selling price is handled separately. If no safe facts exist, return Unknown.
 - evidence entries must identify the source, for example "image 4: odometer", "image 8: VIN plate", "listing text", or "Marketplace screenshot image 2".
- image_count must equal the number of images actually supplied.
- summary must be a short operational review note, not sales copy.`;

  const userText = [
    `Source URL:\n${sourceUrl || "Not supplied"}`,
    `Listing text pasted by user:\n${listingText || "Not supplied"}`,
    `Images supplied: ${images.length}. Review them together and return the structured vehicle extraction.`,
  ].join("\n\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_VEHICLE_MODEL || "gpt-5.4-mini",
        store: false,
        instructions,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: userText },
            ...images.map((image_url) => ({ type: "input_image", image_url, detail: "high" })),
          ],
        }],
        text: { format: { type: "json_schema", name: "nk_vehicle_extraction", strict: true, schema: extractionSchema } },
        max_output_tokens: 6500,
      }),
    });
    const result = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      const message = result.error && typeof result.error === "object" && typeof (result.error as { message?: unknown }).message === "string"
        ? (result.error as { message: string }).message
        : "OpenAI API request failed";
      console.error("NK vehicle extraction failed", response.status, message);
      return NextResponse.json({ error: "NK AI วิเคราะห์ไม่สำเร็จ กรุณาลองใหม่" }, { status: 502 });
    }
    const text = outputText(result);
    if (!text) return NextResponse.json({ error: "NK AI ไม่ได้ส่งผลวิเคราะห์กลับมา" }, { status: 502 });
    const extraction = JSON.parse(text) as Record<string, unknown> & { fields?: Record<string, { value?: unknown; confidence?: number; status?: string; evidence?: string[]; alternatives?: string[] }> };
    const customerField = extraction.fields?.customerDescriptionEn;
    if (customerField) {
      const safeDescription = sanitizeCustomerDescriptionEn(customerField.value);
      customerField.value = safeDescription || "Unknown";
      if (!safeDescription) {
        customerField.confidence = 0;
        customerField.status = "Unknown";
        customerField.evidence = [];
        customerField.alternatives = [];
      }
    }
    extraction.image_count = images.length;
    return NextResponse.json(extraction, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("NK vehicle extraction error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "เชื่อมต่อ NK AI ไม่สำเร็จ กรุณาลองใหม่" }, { status: 502 });
  }
}
