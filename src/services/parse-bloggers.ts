export function parseBloggers(raw: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const part of raw.split(",")) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const name = trimmed.replace(/^@/, "").toLowerCase();
        if (!/^[a-z0-9._]{1,30}$/.test(name)) {
            throw new Error(`BLOGGERS ichida noto'g'ri username: ${trimmed}`);
        }
        if (seen.has(name)) continue;
        seen.add(name);
        out.push(name);
    }

    if (out.length === 0) {
        throw new Error("BLOGGERS bo'sh");
    }

    return out;
}
