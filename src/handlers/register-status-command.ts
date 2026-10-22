import type { CommandContext, Context } from "grammy";
import { loadBloggers } from "../services/parse-bloggers";
import { sendErrorLog } from "../services/log";
import { getWatchStatus } from "../scheduler/watch-bloggers";

export async function registerStatusCommand(ctx: CommandContext<Context>) {
    try {
        const status = getWatchStatus();
        const count = loadBloggers().length;
        const when = status.lastRunAt ? new Date(status.lastRunAt).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" }) : "hali yo'q";
        const lines = [
            "Kuzatuv",
            `Holat: ${status.enabled ? "yoniq" : "o'chiq"}`,
            `Blogerlar: ${count}`,
            `Oxirgi aylanish: ${when}`,
            `Shu aylanishda yuborilgan: ${status.lastNotified}`,
            `Xato: ${status.lastError ?? "yo'q"}`,
        ];
        await ctx.reply(lines.join("\n"));
    } catch (error) {
        await sendErrorLog({ event: "Status bosganda", error, ctx });
    }
}
