import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function within(root, target) {
  const relative = path.relative(root, target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function boundedBytes(response) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_IMAGE_BYTES) throw new Error("image_too_large");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("image_unavailable");
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("image_too_large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), size);
}

async function fetchImage(url, fetchImpl) {
  let current = url;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetchImpl(current, { redirect: "manual", signal: AbortSignal.timeout(20_000), headers: { "user-agent": "NKCarsEvidenceCollector/1.0" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("image_unavailable");
      const next = new URL(location, current);
      if (next.protocol !== "https:" || !/(^|\.)(fbcdn\.net|fbsbx\.com|facebook\.com)$/i.test(next.hostname.replace(/^www\./, ""))) throw new Error("image_redirect_rejected");
      current = next.toString();
      continue;
    }
    const contentType = (response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
    if (!response.ok || !IMAGE_TYPES.has(contentType)) throw new Error("image_unavailable");
    return boundedBytes(response);
  }
  throw new Error("image_redirect_rejected");
}

export class QnapMediaStore {
  constructor({ customerRoot, internalRoot, fetchImpl = fetch } = {}) {
    this.customerRoot = path.resolve(customerRoot || "/data/media/customer-visible");
    this.internalRoot = path.resolve(internalRoot || "/data/media/internal-only");
    this.fetchImpl = fetchImpl;
  }

  async retainCandidateEvidence(candidate) {
    const directory = path.join(this.internalRoot, "automated", candidate.vehicleId);
    if (!within(this.internalRoot, directory)) throw new Error("invalid_media_path");
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    const media = [];
    const failures = [];
    const evidence = [
      ...candidate.images.map((url) => ({ url, kind: "image" })),
      ...(candidate.screenshots || []).map((url) => ({ url, kind: "screenshot" })),
    ];
    for (const [index, item] of evidence.entries()) {
      try {
        const source = await fetchImage(item.url, this.fetchImpl);
        const output = await sharp(source, { failOn: "warning", limitInputPixels: 40_000_000 })
          .rotate()
          .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 88, mozjpeg: true })
          .toBuffer();
        const sha256 = crypto.createHash("sha256").update(output).digest("hex");
        const filename = `${String(index + 1).padStart(3, "0")}-${item.kind}-${sha256.slice(0, 16)}.jpg`;
        const target = path.join(directory, filename);
        await fs.writeFile(target, output, { mode: 0o600 });
        media.push({
          mediaId: `${candidate.vehicleId}:auto-${String(index + 1).padStart(3, "0")}-${item.kind}-${sha256.slice(0, 12)}`,
          vehicleId: candidate.vehicleId,
          relativePath: `automated/${candidate.vehicleId}/${filename}`,
          visibility: "INTERNAL_ONLY",
          lifecycleStage: item.kind === "screenshot" ? "Evidence" : "Source",
          sha256,
          sizeBytes: output.length,
        });
      } catch (error) {
        failures.push({ index: index + 1, code: error instanceof Error && /^[a-z0-9_]{1,80}$/i.test(error.message) ? error.message : "image_processing_failed" });
      }
    }
    return { media, failures };
  }

  async retainCandidateImages(candidate) {
    return this.retainCandidateEvidence(candidate);
  }

  async read(relativePath, visibility) {
    const root = visibility === "CUSTOMER_VISIBLE" ? this.customerRoot : this.internalRoot;
    const normalized = String(relativePath || "").replace(/\\/g, "/");
    const variants = visibility === "CUSTOMER_VISIBLE"
      ? [normalized.replace(/^public\/vehicle-marketplace\//, ""), normalized]
      : [normalized.replace(/^\.migration-private\//, ""), normalized.replace(/^private\//, ""), normalized];
    for (const variant of variants) {
      const target = path.resolve(root, ...variant.split("/").filter(Boolean));
      if (!within(root, target)) continue;
      try {
        return await fs.readFile(target);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
    throw new Error("media_not_found");
  }
}
