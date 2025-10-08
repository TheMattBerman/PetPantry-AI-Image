import fs from "node:fs/promises";
import path from "node:path";

export type WatermarkPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type WatermarkOptions = {
    logoPath?: string;
    marginPx?: number;
    logoWidthRatio?: number; // relative to base image width
    minLogoWidthPx?: number;
    jpegQuality?: number;
    /** When provided, overrides all auto placement logic */
    forcePosition?: WatermarkPosition;
    /** Preferred position if auto analysis fails */
    fallbackPosition?: WatermarkPosition;
    /** Provide a subset of candidate positions to score */
    candidatePositions?: WatermarkPosition[];
    /** Disable automatic placement scoring when false */
    autoPlacement?: boolean;
};

export type WatermarkResult = {
    buffer: Buffer;
    contentType: string;
    extension: string; // without leading dot
    watermarked: boolean;
    metadata?: {
        position: WatermarkPosition;
        score?: number;
        autoPlacement?: boolean;
    };
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

function uniquePositions(values: WatermarkPosition[]): WatermarkPosition[] {
    const seen = new Set<WatermarkPosition>();
    const result: WatermarkPosition[] = [];
    for (const value of values) {
        if (!seen.has(value)) {
            seen.add(value);
            result.push(value);
        }
    }
    return result;
}

function getPositionCoordinates(
    position: WatermarkPosition,
    baseWidth: number,
    baseHeight: number,
    overlayWidth: number,
    overlayHeight: number,
    marginPx: number
) {
    const safeMargin = Math.max(0, Math.round(marginPx));
    const maxLeft = Math.max(0, baseWidth - overlayWidth);
    const maxTop = Math.max(0, baseHeight - overlayHeight);
    const rightAlignedLeft = Math.max(0, baseWidth - overlayWidth - safeMargin);
    const bottomAlignedTop = Math.max(0, baseHeight - overlayHeight - safeMargin);
    const leftAlignedLeft = Math.min(safeMargin, maxLeft);
    const topAlignedTop = Math.min(safeMargin, maxTop);

    switch (position) {
        case "top-left":
            return { left: leftAlignedLeft, top: topAlignedTop };
        case "top-right":
            return { left: rightAlignedLeft, top: topAlignedTop };
        case "bottom-left":
            return { left: leftAlignedLeft, top: bottomAlignedTop };
        case "bottom-right":
        default:
            return { left: rightAlignedLeft, top: bottomAlignedTop };
    }
}

async function scorePlacement(
    sharpInstanceFactory: (input: Buffer) => any,
    inputBuffer: Buffer,
    baseWidth: number,
    baseHeight: number,
    overlayWidth: number,
    overlayHeight: number,
    marginPx: number,
    position: WatermarkPosition
): Promise<{ score: number; left: number; top: number }> {
    const { left, top } = getPositionCoordinates(position, baseWidth, baseHeight, overlayWidth, overlayHeight, marginPx);

    const sampleWidth = Math.max(1, Math.min(baseWidth - left, overlayWidth + marginPx));
    const sampleHeight = Math.max(1, Math.min(baseHeight - top, overlayHeight + marginPx));

    const sample = sharpInstanceFactory(inputBuffer)
        .extract({ left, top, width: sampleWidth, height: sampleHeight })
        .removeAlpha()
        .greyscale();

    const stats = await sample.stats();
    const channel = stats.channels?.[0];
    const entropy = channel?.entropy ?? Number.POSITIVE_INFINITY;
    const stdev = channel?.stdev ?? Number.POSITIVE_INFINITY;
    const score = entropy + (stdev / 255);

    return { score, left, top };
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
            metadata: {
                position: options.fallbackPosition ?? "bottom-right",
                autoPlacement: false,
            },
        };
    }

    const sharp = sharpLib as any;
    const sharpFactory = (buffer: Buffer) => sharp(buffer);

    const marginPx = Math.max(0, options.marginPx ?? 24);
    const logoWidthRatio = options.logoWidthRatio ?? 0.22;
    const minLogoWidthPx = options.minLogoWidthPx ?? 64;
    const jpegQuality = options.jpegQuality ?? 90;

    // Load base image and read dimensions
    const base = sharpFactory(inputBuffer);
    const meta = await base.metadata();
    const baseWidth: number | undefined = meta.width;
    const baseHeight: number | undefined = meta.height;

    // If we can't read dimensions, just convert to JPEG without watermark
    if (!baseWidth || !baseHeight) {
        console.warn("[watermark] Unable to read base image dimensions; converting to JPEG without watermark");
        const buffer = await base.jpeg({ quality: jpegQuality, chromaSubsampling: "4:4:4" }).toBuffer();
        return {
            buffer,
            contentType: "image/jpeg",
            extension: "jpg",
            watermarked: false,
            metadata: {
                position: options.fallbackPosition ?? "bottom-right",
                autoPlacement: false,
            },
        };
    }

    // Load and resize the logo
    const logoPath = options.logoPath || await resolveLogoPath();
    console.log("[watermark] Using logo path:", logoPath);
    const logoFile = await fs.readFile(logoPath);

    const targetLogoWidth = Math.max(minLogoWidthPx, Math.round(baseWidth * logoWidthRatio));

    const { data: resizedLogoBuffer, info: resizedInfo } = await sharpFactory(logoFile)
        .resize({ width: targetLogoWidth, withoutEnlargement: true })
        .toBuffer({ resolveWithObject: true });

    const overlayWidth = resizedInfo.width;
    const overlayHeight = resizedInfo.height;

    const candidatePositions = uniquePositions(
        options.forcePosition
            ? [options.forcePosition]
            : options.candidatePositions && options.candidatePositions.length
                ? options.candidatePositions
                : ["bottom-right", "bottom-left", "top-right", "top-left"]
    );

    let placement = options.forcePosition;
    let placementLeft = 0;
    let placementTop = 0;
    let placementScore: number | undefined;
    let usedAutoPlacement = false;

    if (placement) {
        const coords = getPositionCoordinates(placement, baseWidth, baseHeight, overlayWidth, overlayHeight, marginPx);
        placementLeft = coords.left;
        placementTop = coords.top;
    } else if (options.autoPlacement !== false) {
        try {
            const scored = await Promise.all(
                candidatePositions.map(async (position) => {
                    try {
                        const result = await scorePlacement(
                            sharpFactory,
                            inputBuffer,
                            baseWidth,
                            baseHeight,
                            overlayWidth,
                            overlayHeight,
                            marginPx,
                            position
                        );
                        return { position, ...result };
                    } catch (error) {
                        console.warn(`[watermark] Failed scoring ${position}:`, error);
                        return null;
                    }
                })
            );

            const successful = scored.filter((item): item is { position: WatermarkPosition; score: number; left: number; top: number } => Boolean(item));

            if (successful.length > 0) {
                successful.sort((a, b) => a.score - b.score);
                const best = successful[0];
                placement = best.position;
                placementLeft = best.left;
                placementTop = best.top;
                placementScore = best.score;
                usedAutoPlacement = true;
                console.log("[watermark] Auto placement selected:", placement, { score: best.score.toFixed(3) });
            }
        } catch (error) {
            console.warn("[watermark] Auto placement failed, falling back to manual coordinates", error);
        }
    }

    if (!placement) {
        placement = options.fallbackPosition ?? "bottom-right";
        const coords = getPositionCoordinates(placement, baseWidth, baseHeight, overlayWidth, overlayHeight, marginPx);
        placementLeft = coords.left;
        placementTop = coords.top;
    }

    const composited = await sharpFactory(inputBuffer)
        .composite([
            {
                input: resizedLogoBuffer,
                left: placementLeft,
                top: placementTop,
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
        metadata: {
            position: placement,
            score: placementScore,
            autoPlacement: usedAutoPlacement,
        },
    };
}


