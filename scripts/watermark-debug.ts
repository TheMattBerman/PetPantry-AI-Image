import fs from "node:fs/promises";
import { watermarkAndPreferJpeg } from "../server/watermark";

const url = process.argv[2];

if (!url) {
    console.error("Usage: npm run watermark-debug <image-url>");
    process.exit(1);
}

async function main() {
    console.log("Fetching", url);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Fetch failed with status ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || undefined;
    const buffer = Buffer.from(await res.arrayBuffer());

    const candidatePositionsEnv = process.env.WATERMARK_CANDIDATE_POSITIONS;
    const candidatePositions = candidatePositionsEnv
        ? candidatePositionsEnv.split(",").map(p => p.trim()).filter(Boolean)
        : undefined;
    const autoPlacementEnv = process.env.WATERMARK_AUTO_PLACEMENT;
    const autoPlacement = autoPlacementEnv === undefined ? true : autoPlacementEnv !== "false";

    const result = await watermarkAndPreferJpeg(buffer, contentType, {
        marginPx: Number(process.env.WATERMARK_MARGIN_PX ?? 32),
        logoWidthRatio: Number(process.env.WATERMARK_LOGO_WIDTH_RATIO ?? 0.18),
        minLogoWidthPx: Number(process.env.WATERMARK_MIN_LOGO_PX ?? 48),
        jpegQuality: Number(process.env.WATERMARK_JPEG_QUALITY ?? 90),
        forcePosition: process.env.WATERMARK_FORCE_POSITION as any,
        fallbackPosition: (process.env.WATERMARK_FALLBACK_POSITION as any) || "bottom-right",
        candidatePositions: candidatePositions as any,
        autoPlacement,
    });

    const outPath = "/home/runner/workspace/tmp-watermark-debug.jpg";
    await fs.writeFile(outPath, result.buffer);
    console.log("Watermark result", result);
    console.log("Saved to", outPath);
}

main().catch(err => {
    console.error("Watermark debug failed", err);
    process.exit(1);
});


