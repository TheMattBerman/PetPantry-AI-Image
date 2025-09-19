import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const requiredEnv = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_UPLOADS_BUCKET",
    "R2_GENERATED_BUCKET",
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        // Do not throw to keep dev experience smooth; routes can check and error gracefully
        // console.warn(`Missing env ${key} for R2 configuration`);
    }
}

export const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : undefined,
    credentials: process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
        : undefined,
    forcePathStyle: true,
});

export async function uploadBufferToR2(params: {
    bucket: string;
    key: string;
    body: Buffer | Uint8Array | ArrayBuffer;
    contentType?: string;
    cacheControl?: string;
}): Promise<void> {
    const command = new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        CacheControl: params.cacheControl,
    });
    await r2.send(command);
}

export async function getPresignedGetUrl(params: {
    bucket: string;
    key: string;
    expiresInSeconds?: number;
}): Promise<string> {
    const getCmd = new GetObjectCommand({ Bucket: params.bucket, Key: params.key });
    const url = await getSignedUrl(r2, getCmd, { expiresIn: params.expiresInSeconds ?? 900 });
    return url;
}

export async function getPresignedPutUrl(params: {
    bucket: string;
    key: string;
    contentType?: string;
    expiresInSeconds?: number;
}): Promise<string> {
    const putCmd = new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
        ContentType: params.contentType,
    });
    const url = await getSignedUrl(r2, putCmd, { expiresIn: params.expiresInSeconds ?? 900 });
    return url;
}

export function generatedPublicUrlForKey(key: string): string | null {
    let base = process.env.R2_GENERATED_PUBLIC_BASE_URL || "";

    // If base isn't provided or doesn't look like r2.dev, attempt to build from envs
    const bucket = process.env.R2_GENERATED_BUCKET;
    const accountId = process.env.R2_ACCOUNT_ID;

    // Normalize common misconfigs like cloudflarestorage endpoint
    if (base.includes("r2.cloudflarestorage.com")) {
        // Accept formats like https://<account>.r2.cloudflarestorage.com/<bucket>
        try {
            const u = new URL(base);
            const parts = u.hostname.split("."); // [accountId, 'r2', 'cloudflarestorage', 'com']
            const pathParts = u.pathname.replace(/^\//, "").split("/");
            const b = bucket || pathParts[0];
            const a = accountId || parts[0];
            base = `https://${b}.${a}.r2.dev`;
        } catch { }
    }

    // Construct if missing or clearly not r2.dev
    if (!base || !base.includes("r2.dev")) {
        if (bucket && accountId) {
            base = `https://${bucket}.${accountId}.r2.dev`;
        } else {
            return null;
        }
    }

    const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${trimmed}/${key}`;
}

export function makeUploadKey(options: {
    userId?: string;
    originalName?: string;
    prefix?: string;
}): string {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const uuid = cryptoRandomUUID();
    const ext = options.originalName?.split(".").pop()?.toLowerCase() || "jpg";
    const basePrefix = options.prefix || "uploads";
    const userPrefix = options.userId ? `user/${options.userId}` : "anon";
    return `${basePrefix}/${userPrefix}/${yyyy}/${mm}/${uuid}.${ext}`;
}

export function makeGeneratedKey(options: {
    type: string;
    resourceId: string;
    extension?: string;
}): string {
    const now = Date.now();
    const ext = (options.extension || "jpg").replace(/^\./, "");
    return `gen/${options.type}/${options.resourceId}/${now}.${ext}`;
}

function cryptoRandomUUID(): string {
    // Node 20 has global crypto.randomUUID; fallback if not available
    const g: any = global as any;
    if (g.crypto && typeof g.crypto.randomUUID === "function") {
        return g.crypto.randomUUID();
    }
    // Simple fallback (not RFC4122-perfect, good enough for keys)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}


