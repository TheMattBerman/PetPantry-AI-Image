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

    const result = await watermarkAndPreferJpeg(buffer, contentType, {
        marginPx: 24,
        logoWidthRatio: 0.08,
        minLogoWidthPx: 64,
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


