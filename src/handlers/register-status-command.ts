import type { CommandContext, Context } from "grammy";
import { parseBloggers } from "../services/parse-bloggers";
import { sendErrorLog } from "../services/log";
import { getWatchStatus } from "../scheduler/watch-bloggers";
import { BLOGGERS_RAW } from "../utils/constants";

export async function registerStatusCommand(ctx: CommandContext<Context>) {
    try {
        const status = getWatchStatus();
        const count = parseBloggers(BLOGGERS_RAW).length;
        const when = status.lastRunAt ? new Date(status.lastRunAt).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" }) : "hali yo'q";
        const lines = [
            "Kuzatuv",
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
