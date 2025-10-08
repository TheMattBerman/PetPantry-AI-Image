interface DripEventOptions {
    email: string;
    action?: string;
    transformationId?: string;
    imageUrl?: string | null;
    userId?: string;
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

async function syncSubscriber(email: string, transformationId?: string, userId?: string) {
    const accountId = process.env.DRIP_ACCOUNT_ID as string;
    const url = `https://api.getdrip.com/v2/${accountId}/subscribers`;

    const payload = {
        subscribers: [
            {
                email,
                double_optin: false,
                custom_fields: {
                    last_transformation_id: transformationId,
                    last_transformation_user_id: userId,
                },
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
        throw new Error(`Drip subscriber sync failed (${response.status}): ${text}`);
    }
}

async function sendDownloadEvent({ email, action, transformationId, imageUrl, userId }: DripEventOptions) {
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
}

export async function trackDownloadInDrip(options: DripEventOptions) {
    if (!hasDripConfig()) {
        console.warn("Skipping Drip tracking: missing DRIP_ACCOUNT_ID or DRIP_API_TOKEN env vars");
        return;
    }

    try {
        await syncSubscriber(options.email, options.transformationId, options.userId);
    } catch (error) {
        console.error("Failed to sync subscriber with Drip", error);
        // Continue to try sending the event even if subscriber sync fails
    }

    try {
        await sendDownloadEvent(options);
    } catch (error) {
        console.error("Failed to send download event to Drip", error);
    }
}


