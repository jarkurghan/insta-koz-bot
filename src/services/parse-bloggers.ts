import { readFileSync } from "node:fs";
import { BLOGGERS_PATH } from "../utils/constants";

export function parseBloggers(value: unknown): string[] {
    if (!Array.isArray(value)) {
        throw new Error("bloggers.json ro'yxat bo'lishi kerak");
    }

    const seen = new Set<string>();
    const out: string[] = [];

    for (const item of value) {
        if (typeof item !== "string") {
            throw new Error("bloggers.json ichida username matn bo'lishi kerak");
        }
        const trimmed = item.trim();
        if (!trimmed) continue;
        const name = trimmed.replace(/^@/, "").toLowerCase();
        if (!/^[a-z0-9._]{1,30}$/.test(name)) {
            throw new Error(`bloggers.json ichida noto'g'ri username: ${trimmed}`);
        }
        if (seen.has(name)) continue;
        seen.add(name);
        out.push(name);
    }

    if (out.length === 0) {
        throw new Error("bloggers.json bo'sh");
    }

    return out;
}

export function loadBloggers(): string[] {
    let parsed: unknown;
    try {
        parsed = JSON.parse(readFileSync(BLOGGERS_PATH, "utf8"));
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`bloggers.json o'qilmadi: ${detail}`);
    }
    return parseBloggers(parsed);
}
