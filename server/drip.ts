interface DripEventOptions {
    email: string;
    action?: string;
    transformationId?: string;
    imageUrl?: string | null;
    userId?: string;
    name?: string;
    occurredAt?: string;
}

const DEFAULT_DOWNLOAD_EVENT = "download_high_res_image";

function hasDripConfig() {
    return Boolean(process.env.DRIP_ACCOUNT_ID && process.env.DRIP_API_TOKEN);
}

function getAuthHeader() {
    const token = process.env.DRIP_API_TOKEN as string;
    const encoded = Buffer.from(`${token}:`).toString("base64");
    return `Basic ${encoded}`;
}

interface SyncSubscriberResult {
    success: boolean;
    status: number;
    body?: unknown;
}

interface SendEventResult {
    success: boolean;
    status: number;
    body?: unknown;
}

async function syncSubscriber(email: string, transformationId?: string, userId?: string, imageUrl?: string | null, name?: string | null): Promise<SyncSubscriberResult> {
    const accountId = process.env.DRIP_ACCOUNT_ID as string;
    const url = `https://api.getdrip.com/v2/${accountId}/subscribers`;

    const customFields: Record<string, string> = {};
    if (transformationId) {
        customFields.last_transformation_id = transformationId;
    }
    if (userId) {
        customFields.last_transformation_user_id = userId;
    }
    if (imageUrl) {
        customFields.ai_image_url = imageUrl;
    }

    const subscriber: Record<string, unknown> = {
        email,
        double_optin: false,
    };

    if (name) {
        subscriber.first_name = name;
    }

    if (Object.keys(customFields).length > 0) {
        subscriber.custom_fields = customFields;
    }

    const payload = {
        subscribers: [subscriber],
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: getAuthHeader(),
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Drip subscriber sync failed (${response.status}): ${text}`);
    }

    const body = await response.json().catch(() => undefined);
    return { success: true, status: response.status, body };
}

async function sendDownloadEvent({ email, action, transformationId, imageUrl, userId, occurredAt }: DripEventOptions): Promise<SendEventResult> {
    const accountId = process.env.DRIP_ACCOUNT_ID as string;
    const url = `https://api.getdrip.com/v2/${accountId}/events`;

    const eventAction = action || process.env.DRIP_DOWNLOAD_EVENT || DEFAULT_DOWNLOAD_EVENT;

    const payload = {
        events: [
            {
                email,
                action: eventAction,
                properties: {
                    transformation_id: transformationId,
                    image_url: imageUrl,
                    user_id: userId,
                },
                ...(occurredAt ? { occurred_at: occurredAt } : {}),
            },
        ],
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: getAuthHeader(),
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Drip event send failed (${response.status}): ${text}`);
    }

    const body = await response.json().catch(() => undefined);
    return { success: true, status: response.status, body };
}

interface TrackDownloadResult {
    skipped: boolean;
    subscriberSync?: SyncSubscriberResult;
    eventSend?: SendEventResult;
    errors?: Array<{ stage: "subscriber" | "event"; error: string }>;
}

export async function trackDownloadInDrip(options: DripEventOptions): Promise<TrackDownloadResult> {
    if (!hasDripConfig()) {
        console.warn("Skipping Drip tracking: missing DRIP_ACCOUNT_ID or DRIP_API_TOKEN env vars");
        return { skipped: true };
    }

    const result: TrackDownloadResult = {
        skipped: false,
        errors: [],
    };

    try {
        result.subscriberSync = await syncSubscriber(options.email, options.transformationId, options.userId, options.imageUrl, options.name ?? null);
        console.info("Drip subscriber sync successful", {
            email: options.email,
            status: result.subscriberSync.status,
        });
    } catch (error) {
        console.error("Failed to sync subscriber with Drip", error);
        // Continue to try sending the event even if subscriber sync fails
        result.errors?.push({ stage: "subscriber", error: error instanceof Error ? error.message : String(error) });
    }

    try {
        result.eventSend = await sendDownloadEvent(options);
        console.info("Drip event send successful", {
            email: options.email,
            action: options.action || process.env.DRIP_DOWNLOAD_EVENT || DEFAULT_DOWNLOAD_EVENT,
            status: result.eventSend.status,
        });
    } catch (error) {
        console.error("Failed to send download event to Drip", error);
        result.errors?.push({ stage: "event", error: error instanceof Error ? error.message : String(error) });
    }

    if (result.errors && result.errors.length === 0) {
        delete result.errors;
    }

    return result;
}


