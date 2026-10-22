import type { CommandContext, Context } from "grammy";
import { parseBloggers } from "../services/parse-bloggers";
import { sendErrorLog } from "../services/log";
import { BLOGGERS_RAW } from "../utils/constants";

export async function registerStartCommand(ctx: CommandContext<Context>) {
    try {
        const count = parseBloggers(BLOGGERS_RAW).length;
        await ctx.reply(`Bot ishlayapti.\nKuzatilayotgan blogerlar: ${count} ta.\nYangi postlar belgilangan chatga yuboriladi.`);
    } catch (error) {
        await sendErrorLog({ event: "Start bosganda", error, ctx });
    }
}
