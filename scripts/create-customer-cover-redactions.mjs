import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const evidenceRoot = path.join(root, "public", "vehicle-evidence", "nk-capture-batch-2026-08-25");
const customerRoot = path.join(root, "public", "vehicle-marketplace", "owner-reviewed-2026-08-26");

const covers = [
  {
    vehicle: "nk-mkt-02",
    source: ["1072449122204129", "317f53df576e1dff.png"],
    redactions: [
      { left: 204, top: 447, width: 102, height: 62 },
      { left: 0, top: 88, width: 96, height: 78 },
    ],
  },
  {
    vehicle: "nk-mkt-04",
    source: ["1612765793828637", "094069d1fae161a1.jpg"],
    redactions: [{ left: 416, top: 382, width: 148, height: 68 }],
  },
  {
    vehicle: "nk-mkt-07",
    source: ["28105500719058350", "caab8104dec4001d.jpg"],
    redactions: [
      { left: 712, top: 432, width: 112, height: 72 },
      { left: 370, top: 0, width: 365, height: 74 },
    ],
  },
  {
    vehicle: "nk-mkt-09",
    source: ["1015890394739418", "15c95af7b8c4fb15.png"],
    redactions: [
      { left: 376, top: 474, width: 184, height: 99 },
      { left: 0, top: 0, width: 108, height: 122 },
    ],
  },
];

for (const cover of covers) {
  const sourcePath = path.join(evidenceRoot, ...cover.source);
  const outputDirectory = path.join(customerRoot, cover.vehicle);
  const outputPath = path.join(outputDirectory, "cover-redacted.webp");
  const source = sharp(sourcePath);
  const metadata = await source.metadata();

  const overlays = await Promise.all(
    cover.redactions.map(async (region) => {
      if (
        region.left < 0 ||
        region.top < 0 ||
        region.left + region.width > metadata.width ||
        region.top + region.height > metadata.height
      ) {
        throw new Error(`Invalid redaction region for ${cover.vehicle}`);
      }

      const input = await sharp(sourcePath)
        .extract(region)
        .blur(22)
        .toBuffer();

      return { input, left: region.left, top: region.top };
    }),
  );

  await mkdir(outputDirectory, { recursive: true });
  await sharp(sourcePath)
    .composite(overlays)
    .webp({ quality: 90 })
    .toFile(outputPath);

  console.log(path.relative(root, outputPath));
}
