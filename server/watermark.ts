import fs from "node:fs/promises";
import path from "node:path";

export type WatermarkOptions = {
    logoPath?: string;
    marginPx?: number;
    logoWidthRatio?: number; // relative to base image width
    minLogoWidthPx?: number;
    jpegQuality?: number;
};

export type WatermarkResult = {
    buffer: Buffer;
    contentType: string;
    extension: string; // without leading dot
    watermarked: boolean;
};

async function resolveLogoPath(): Promise<string> {
    if (process.env.WATERMARK_LOGO_PATH) {
        return process.env.WATERMARK_LOGO_PATH;
    }
    // Prefer white logo if present, fallback to color
    const candidates = [
        "/home/runner/workspace/client/public/images/the-pet-pantry-logo-white.png",
        "/home/runner/workspace/client/public/images/the-pet-pantry-logo.png",
    ];
    for (const p of candidates) {
        try {
            await fs.access(p);
            return p;
        } catch { }
    }
    // Last resort: relative fallbacks
    const relCandidates = [
        path.resolve(process.cwd(), "client/public/images/the-pet-pantry-logo-white.png"),
        path.resolve(process.cwd(), "client/public/images/the-pet-pantry-logo.png"),
    ];
    for (const p of relCandidates) {
        try {
            await fs.access(p);
            return p;
        } catch { }
    }
    throw new Error("Watermark logo not found. Set WATERMARK_LOGO_PATH or place a logo PNG under client/public/images/");
}

async function tryImportSharp(): Promise<any | null> {
    try {
        const mod = await import("sharp");
        // ESM default export handling
        // @ts-ignore
        return mod?.default || mod;
    } catch {
        return null;
    }
}

function inferExtensionFromContentType(contentType?: string): string {
    if (!contentType) return "jpg";
    const lc = contentType.toLowerCase();
    if (lc.includes("png")) return "png";
    if (lc.includes("webp")) return "webp";
    if (lc.includes("gif")) return "gif";
    return "jpg";
}

/**
 * Apply a bottom-right watermark logo and return a JPEG buffer.
 * If Sharp is not available, returns the original buffer unchanged.
 */
export async function watermarkAndPreferJpeg(
    inputBuffer: Buffer,
    sourceContentType?: string,
    options: WatermarkOptions = {}
): Promise<WatermarkResult> {
    const sharpLib = await tryImportSharp();
    if (!sharpLib) {
        console.warn("[watermark] Sharp not available; skipping watermark and JPEG conversion");
        return {
            buffer: inputBuffer,
            contentType: sourceContentType || "application/octet-stream",
            extension: inferExtensionFromContentType(sourceContentType),
            watermarked: false,
        };
    }

    const sharp = sharpLib as any;

    const marginPx = Math.max(0, options.marginPx ?? 24);
    const logoWidthRatio = options.logoWidthRatio ?? 0.08;
    const minLogoWidthPx = options.minLogoWidthPx ?? 64;
    const jpegQuality = options.jpegQuality ?? 90;

    // Load base image and read dimensions
    const base = sharp(inputBuffer, { failOn: false });
    const meta = await base.metadata();
    const baseWidth: number | undefined = meta.width;
    const baseHeight: number | undefined = meta.height;

    // If we can't read dimensions, just convert to JPEG without watermark
    if (!baseWidth || !baseHeight) {
        console.warn("[watermark] Unable to read base image dimensions; converting to JPEG without watermark");
        const buffer = await base.jpeg({ quality: jpegQuality, chromaSubsampling: "4:4:4" }).toBuffer();
        return { buffer, contentType: "image/jpeg", extension: "jpg", watermarked: false };
    }

    // Load and resize the logo
    const logoPath = options.logoPath || await resolveLogoPath();
    console.log("[watermark] Using logo path:", logoPath);
    const logoFile = await fs.readFile(logoPath);

    const targetLogoWidth = Math.max(minLogoWidthPx, Math.round(baseWidth * logoWidthRatio));

    const { data: resizedLogoBuffer, info: resizedInfo } = await sharp(logoFile)
        .resize({ width: targetLogoWidth, withoutEnlargement: true })
        .toBuffer({ resolveWithObject: true });

    const overlayWidth = resizedInfo.width;
    const overlayHeight = resizedInfo.height;

    const left = Math.max(0, baseWidth - overlayWidth - marginPx);
    const top = Math.max(0, baseHeight - overlayHeight - marginPx);

    const composited = await sharp(inputBuffer)
        .composite([
            {
                input: resizedLogoBuffer,
                left,
                top,
                blend: "over",
            },
        ])
        .jpeg({ quality: jpegQuality, chromaSubsampling: "4:4:4" })
        .toBuffer();

    return {
        buffer: composited,
        contentType: "image/jpeg",
        extension: "jpg",
        watermarked: true,
    };
}


