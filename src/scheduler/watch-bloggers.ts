import { BLOGGERS_RAW, POLL_INTERVAL_MINUTES, PROFILE_DELAY_SECONDS } from "../utils/constants";
import { sleep } from "../utils/sleep";
import { sendLog, sendNotify } from "../services/log";
import { parseBloggers } from "../services/parse-bloggers";
import { diffNewShortcodes, loadSeen, saveSeen } from "../services/seen-posts";
import { closeBrowser, ensureLoggedIn, InstagramCheckpointError, postUrl, readProfilePosts } from "../services/instagram";

export type WatchStatus = {
    lastRunAt: string | null;
    lastError: string | null;
    lastNotified: number;
    running: boolean;
};

const status: WatchStatus = {
    lastRunAt: null,
    lastError: null,
    lastNotified: 0,
    running: false,
};

export function getWatchStatus(): WatchStatus {
    return { ...status };
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

async function runRound(): Promise<void> {
    const bloggers = parseBloggers(BLOGGERS_RAW);
    const seen = await loadSeen();
    await ensureLoggedIn();
    let notified = 0;

    for (let i = 0; i < bloggers.length; i++) {
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

        if (i < bloggers.length - 1) {
            await sleep(PROFILE_DELAY_SECONDS * 1000);
        }
    }

    status.lastNotified = notified;
    status.lastRunAt = new Date().toISOString();
    status.lastError = null;
}

export async function watchBloggers(): Promise<void> {
    status.running = true;
    const bloggers = parseBloggers(BLOGGERS_RAW);
    console.log(`Kuzatuv boshlandi: ${bloggers.length} ta bloger, interval ${POLL_INTERVAL_MINUTES} daqiqa`);

    while (true) {
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
        await sleep(launchFailed ? 30_000 : POLL_INTERVAL_MINUTES * 60 * 1000);
    }
}
