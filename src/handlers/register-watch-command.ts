import type { Context } from "grammy";
import { setWatchEnabled, type WatchActor } from "../scheduler/watch-bloggers";
import { sendErrorLog } from "../services/log";
import { watchKeyboard } from "../services/watch-keyboard";

function actorFrom(ctx: Context): WatchActor {
    const from = ctx.from;
    if (!from) return { name: "noma'lum" };
    const name = [from.first_name, from.last_name].filter(Boolean).join(" ");
    const username = from.username ? `@${from.username}` : "username yo'q";
    return { name: `${name} (${username})`, id: from.id };
}

async function switchWatch(ctx: Context, next: boolean) {
    const changed = await setWatchEnabled(next, actorFrom(ctx));
    const same = next ? "Kuzatuv allaqachon yoniq." : "Kuzatuv allaqachon o'chiq.";
    const done = next ? "Kuzatuv yoqildi." : "Kuzatuv o'chirildi.";
    await ctx.reply(changed ? done : same, { reply_markup: watchKeyboard() });
}

export async function registerWatchOn(ctx: Context) {
    try {
        await switchWatch(ctx, true);
    } catch (error) {
        await sendErrorLog({ event: "Kuzatuvni yoqishda", error, ctx });
    }
}

export async function registerWatchOff(ctx: Context) {
    try {
        await switchWatch(ctx, false);
    } catch (error) {
        await sendErrorLog({ event: "Kuzatuvni o'chirishda", error, ctx });
    }
}
