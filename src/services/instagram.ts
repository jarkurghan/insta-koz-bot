import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { INSTAGRAM_PASSWORD, INSTAGRAM_USERNAME, SESSION_PATH } from "../utils/constants";
import { sleep } from "../utils/sleep";

const USER_AGENT =
    process.platform === "win32"
        ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const LOGIN_COOLDOWN_MS = 60 * 60 * 1000;

export type GridPost = {
    shortcode: string;
    kind: "p" | "reel";
};

export class InstagramCheckpointError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InstagramCheckpointError";
    }
}

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
let lastLoginAttempt = 0;

export function postsFromHrefs(hrefs: string[]): GridPost[] {
    const posts: GridPost[] = [];
    const seen = new Set<string>();

    for (const href of hrefs) {
        const match = href.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
        if (!match) continue;
        const kind = match[1] === "reel" ? "reel" : "p";
        const shortcode = match[2]!;
        if (seen.has(shortcode)) continue;
        seen.add(shortcode);
        posts.push({ shortcode, kind });
        if (posts.length >= 12) break;
    }

    return posts;
}

export function postUrl(post: GridPost): string {
    return `https://www.instagram.com/${post.kind}/${post.shortcode}/`;
}

export async function closeBrowser(): Promise<void> {
    page = null;
    if (context) {
        await context.close().catch(() => undefined);
        context = null;
    }
    if (browser) {
        await browser.close().catch(() => undefined);
        browser = null;
    }
}

async function hasSessionFile(): Promise<boolean> {
    try {
        await access(SESSION_PATH);
        return true;
    } catch {
        return false;
    }
}

async function saveSession(): Promise<void> {
    if (!context) return;
    await mkdir(path.dirname(SESSION_PATH), { recursive: true });
    await context.storageState({ path: SESSION_PATH });
}

async function getContext(): Promise<BrowserContext> {
    if (context) return context;
    const args = ["--disable-blink-features=AutomationControlled"];
    if (process.platform !== "win32") args.push("--no-sandbox", "--disable-dev-shm-usage");

    browser = await chromium.launch({
        headless: false,
        timeout: 45_000,
        channel: process.platform === "win32" ? "chrome" : undefined,
        args,
    });

    const hasState = await hasSessionFile();
    try {
        context = await browser.newContext({
            viewport: { width: 1280, height: 900 },
            locale: "en-US",
            userAgent: USER_AGENT,
            storageState: hasState ? SESSION_PATH : undefined,
        });
    } catch {
        context = await browser.newContext({
            viewport: { width: 1280, height: 900 },
            locale: "en-US",
            userAgent: USER_AGENT,
        });
    }
    context.setDefaultTimeout(20_000);
    context.setDefaultNavigationTimeout(45_000);
    return context;
}

async function getPage(): Promise<Page> {
    const currentContext = await getContext();
    if (page && !page.isClosed()) return page;
    page = currentContext.pages()[0] ?? (await currentContext.newPage());
    return page;
}

async function hasSession(current: Page): Promise<boolean> {
    const cookies = await current.context().cookies("https://www.instagram.com");
    return cookies.some((cookie) => cookie.name === "sessionid" && cookie.value.length > 0);
}

function looksLikeCheckpoint(url: string, body: string): boolean {
    const currentUrl = url.toLowerCase();
    if (currentUrl.includes("/challenge") || currentUrl.includes("/checkpoint")) return true;
    const text = body.toLowerCase();
    return (
        text.includes("suspicious login") ||
        text.includes("help us confirm") ||
        text.includes("enter the code") ||
        text.includes("tasdiqlash kodi") ||
        text.includes("shubhali urinish")
    );
}

async function dismissDialogs(current: Page): Promise<void> {
    for (let i = 0; i < 3; i++) {
        const button = current
            .getByRole("button", { name: /not now|hozir emas|allow all cookies|only allow essential|decline optional cookies/i })
            .first();
        const visible = await button.isVisible().catch(() => false);
        if (!visible) break;
        await button.click().catch(() => undefined);
        await sleep(400);
    }
}

async function login(current: Page): Promise<void> {
    await current.goto("https://www.instagram.com/accounts/login/", { waitUntil: "domcontentloaded" });
    await dismissDialogs(current);
    const username = current.locator('input[name="email"], input[name="username"]').first();
    const password = current.locator('input[name="pass"], input[name="password"]').first();
    await username.waitFor({ state: "visible" });
    lastLoginAttempt = Date.now();
    await username.fill(INSTAGRAM_USERNAME);
    await password.fill(INSTAGRAM_PASSWORD);

    const submit = current.locator("#login_form").getByText(/^log in$/i).first();
    if (await submit.isVisible().catch(() => false)) {
        await submit.click();
    } else {
        await password.press("Enter");
    }

    const started = Date.now();
    while (Date.now() - started < 20_000) {
        if (await hasSession(current)) {
            await dismissDialogs(current);
            await saveSession();
            return;
        }
        const text = await current.locator("body").innerText().catch(() => "");
        if (looksLikeCheckpoint(current.url(), text)) {
            throw new InstagramCheckpointError("Instagram tasdiqlash so'radi. Parol qayta yuborilmaydi.");
        }
        await sleep(1000);
    }

    throw new InstagramCheckpointError("Instagram sessiyasi ochilmadi. Parol qayta yuborilmaydi.");
}

export async function ensureLoggedIn(): Promise<void> {
    const current = await getPage();
    await current.goto("https://www.instagram.com/", { waitUntil: "domcontentloaded" });
    await dismissDialogs(current);
    if (await hasSession(current)) {
        await saveSession();
        return;
    }

    const body = await current.locator("body").innerText().catch(() => "");
    if (looksLikeCheckpoint(current.url(), body)) {
        lastLoginAttempt = Date.now();
        throw new InstagramCheckpointError("Instagram checkpoint ochiq. Parol qayta yuborilmaydi.");
    }

    if (lastLoginAttempt && Date.now() - lastLoginAttempt < LOGIN_COOLDOWN_MS) {
        throw new InstagramCheckpointError("Sessiya yo'q. Parol qayta yuborilmaydi, cooldown kutilyapti.");
    }

    await login(current);
}

export type ProfileRead = { ok: true; posts: GridPost[] } | { ok: false; reason: "missing" | "private" | "empty" };

export async function readProfilePosts(username: string): Promise<ProfileRead> {
    const current = await getPage();
    await current.goto(`https://www.instagram.com/${username}/`, { waitUntil: "domcontentloaded" });
    await current.waitForSelector('a[href*="/p/"], a[href*="/reel/"]', { timeout: 15_000 }).catch(() => undefined);

    const body = await current.locator("body").innerText().catch(() => "");
    const hrefs = await current.locator('a[href*="/p/"], a[href*="/reel/"]').evaluateAll((anchors) =>
        anchors.map((anchor) => anchor.getAttribute("href") ?? "").filter((href) => href.length > 0),
    );
    const posts = postsFromHrefs(hrefs);
    if (posts.length > 0) return { ok: true, posts };

    if (/sorry, this page isn.?t available|sahifa mavjud emas/i.test(body)) {
        return { ok: false, reason: "missing" };
    }
    if (/this account is private|this profile is private|bu hisob yopiq/i.test(body)) {
        return { ok: false, reason: "private" };
    }
    return { ok: false, reason: "empty" };
}
