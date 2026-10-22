import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SEEN_POSTS_PATH } from "../utils/constants";

export type SeenMap = Record<string, string[]>;

export function diffNewShortcodes(stored: string[] | undefined, current: string[]): { baseline: boolean; fresh: string[] } {
    if (!stored) return { baseline: true, fresh: [] };
    const known = new Set(stored);
    const unknown = current.filter((code) => !known.has(code));
    return { baseline: false, fresh: [...unknown].reverse() };
}

function isSeenMap(value: unknown): value is SeenMap {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return Object.values(value).every((item) => Array.isArray(item) && item.every((code) => typeof code === "string"));
}

export async function loadSeen(): Promise<SeenMap> {
    try {
        const text = await readFile(SEEN_POSTS_PATH, "utf8");
        const data: unknown = JSON.parse(text);
        if (!isSeenMap(data)) return {};
        return data;
    } catch {
        return {};
    }
}

export async function saveSeen(map: SeenMap): Promise<void> {
    await mkdir(path.dirname(SEEN_POSTS_PATH), { recursive: true });
    await writeFile(SEEN_POSTS_PATH, JSON.stringify(map, null, 2));
}
