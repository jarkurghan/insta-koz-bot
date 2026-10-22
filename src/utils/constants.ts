import path from "node:path";

function readPositiveInt(value: string | undefined, fallback: number): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
}

export const BOT_TOKEN = process.env.BOT_TOKEN || "";
export const NOTIFY_CHAT_ID = process.env.NOTIFY_CHAT_ID || "";
export const LOG_CHAT_ID = process.env.LOG_CHAT_ID || "";
export const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || "";
export const INSTAGRAM_PASSWORD = process.env.INSTAGRAM_PASSWORD || "";
export const POLL_INTERVAL_MINUTES = readPositiveInt(process.env.POLL_INTERVAL_MINUTES, 15);
export const PROFILE_DELAY_SECONDS = readPositiveInt(process.env.PROFILE_DELAY_SECONDS, 10);

export const DATA_DIR = path.join(process.cwd(), "data");
export const BLOGGERS_PATH = path.join(process.cwd(), "src", "utils", "bloggers.json");
export const SESSION_PATH = path.join(DATA_DIR, "instagram-state.json");
export const SEEN_POSTS_PATH = path.join(DATA_DIR, "seen-posts.json");

export function assertConfig(): void {
    const missing: string[] = [];
    if (!BOT_TOKEN) missing.push("BOT_TOKEN");
    if (!NOTIFY_CHAT_ID) missing.push("NOTIFY_CHAT_ID");
    if (!LOG_CHAT_ID) missing.push("LOG_CHAT_ID");
    if (!INSTAGRAM_USERNAME) missing.push("INSTAGRAM_USERNAME");
    if (!INSTAGRAM_PASSWORD) missing.push("INSTAGRAM_PASSWORD");
    if (missing.length > 0) {
        throw new Error(`Env yetishmayapti: ${missing.join(", ")}`);
    }
}
