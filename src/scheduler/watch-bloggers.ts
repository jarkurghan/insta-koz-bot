import { POLL_INTERVAL_MINUTES, PROFILE_DELAY_SECONDS } from "../utils/constants";
import { sleep } from "../utils/sleep";
import { sendLog, sendNotify } from "../services/log";
import { loadBloggers } from "../services/parse-bloggers";
import { diffNewShortcodes, loadSeen, saveSeen } from "../services/seen-posts";
import { closeBrowser, ensureLoggedIn, InstagramCheckpointError, postUrl, readProfilePosts } from "../services/instagram";

export type WatchStatus = {
    lastRunAt: string | null;
    lastError: string | null;
    lastNotified: number;
    running: boolean;
    enabled: boolean;
};

export type WatchActor = {
    name: string;
    id?: number;
};

const status: WatchStatus = {
    lastRunAt: null,
    lastError: null,
    lastNotified: 0,
    running: false,
    enabled: true,
};

export function getWatchStatus(): WatchStatus {
    return { ...status };
}

export function getWatchEnabled(): boolean {
    return status.enabled;
}

export async function setWatchEnabled(next: boolean, actor: WatchActor): Promise<boolean> {
    if (status.enabled === next) return false;
    status.enabled = next;
    if (!next) await closeBrowser();
    const lines = [next ? "Kuzatuv yoqildi" : "Kuzatuv o'chirildi", `Kim: ${actor.name}`];
    if (actor.id !== undefined) lines.push(`ID: ${actor.id}`);
    await sendLog(lines.join("\n"));
    return true;
}

async function sleepWhileEnabled(ms: number): Promise<void> {
    const until = Date.now() + ms;
    while (Date.now() < until) {
        if (!status.enabled) return;
        await sleep(Math.min(1000, until - Date.now()));
    }
}

function errorText(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

function formatPost(username: string, url: string): string {
    const safe = username.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<b>Yangi post</b>\n\n@${safe}\n${url}`;
}

const reportedProfiles = new Set<string>();

async function reportProfile(username: string, reason: string): Promise<void> {
    const key = `${username}:${reason}`;
    console.error(`@${username}: ${reason}`);
    if (reportedProfiles.has(key)) return;
    reportedProfiles.add(key);
    await sendLog(`@${username}: ${reason}`);
}

function clearProfileReports(username: string): void {
    for (const key of reportedProfiles) {
        if (key.startsWith(`${username}:`)) reportedProfiles.delete(key);
    }
}

function isBrowserClosed(error: unknown): boolean {
    const message = errorText(error);
    return /has been closed|Target closed|Browser closed|context or browser/i.test(message);
}

async function stopRound(): Promise<void> {
    await closeBrowser();
}

async function runRound(): Promise<void> {
    if (!status.enabled) return;
    const bloggers = loadBloggers();
    const seen = await loadSeen();
    await ensureLoggedIn();
    if (!status.enabled) {
        await stopRound();
        return;
    }
    let notified = 0;

    for (let i = 0; i < bloggers.length; i++) {
        if (!status.enabled) {
            await stopRound();
            return;
        }
        const username = bloggers[i]!;
        try {
            const result = await readProfilePosts(username);
            if (!result.ok) {
                const reason = result.reason === "missing" ? "profil topilmadi" : result.reason === "private" ? "yopiq profil" : "post topilmadi";
                await reportProfile(username, reason);
            } else {
                clearProfileReports(username);
                const stored = Object.prototype.hasOwnProperty.call(seen, username) ? seen[username] : undefined;
                const { baseline, fresh } = diffNewShortcodes(
                    stored,
                    result.posts.map((post) => post.shortcode),
                );
                seen[username] = result.posts.map((post) => post.shortcode);
                await saveSeen(seen);

                if (!baseline) {
                    const byCode = new Map(result.posts.map((post) => [post.shortcode, post]));
                    for (const code of fresh) {
                        const post = byCode.get(code);
                        if (!post) continue;
                        try {
                            await sendNotify(formatPost(username, postUrl(post)));
                            notified += 1;
                        } catch (error) {
                            await sendLog(`Xabar yuborilmadi @${username}: ${errorText(error)}`);
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof InstagramCheckpointError || isBrowserClosed(error)) throw error;
            await sendLog(`@${username}: ${errorText(error)}`);
        }

        if (!status.enabled) {
            await stopRound();
            return;
        }

        if (i < bloggers.length - 1) {
            await sleepWhileEnabled(PROFILE_DELAY_SECONDS * 1000);
        }
    }

    status.lastNotified = notified;
    status.lastRunAt = new Date().toISOString();
    status.lastError = null;
}

export async function watchBloggers(): Promise<void> {
    status.running = true;
    status.enabled = true;
    const bloggers = loadBloggers();
    console.log(`Kuzatuv boshlandi: ${bloggers.length} ta bloger, interval ${POLL_INTERVAL_MINUTES} daqiqa`);
    await sendLog("Kuzatuv yoqildi\nKim: ishga tushirish");

    while (true) {
        if (!status.enabled) {
            await closeBrowser();
            await sleep(1000);
            continue;
        }

        let launchFailed = false;
        try {
            await runRound();
        } catch (error) {
            const message = errorText(error);
            launchFailed = /Timeout \d+ms exceeded|Executable doesn't exist|browserType\.launch/i.test(message);
            const changed = status.lastError !== message;
            status.lastError = message;
            console.error(message);
            if (changed) await sendLog(message);
            await closeBrowser();
        }

        if (!status.enabled) continue;
        await sleepWhileEnabled(launchFailed ? 30_000 : POLL_INTERVAL_MINUTES * 60 * 1000);
    }
}
