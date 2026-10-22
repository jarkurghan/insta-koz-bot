import type { CommandContext, Context } from "grammy";
import { getWatchEnabled } from "../scheduler/watch-bloggers";
import { loadBloggers } from "../services/parse-bloggers";
import { sendErrorLog } from "../services/log";
import { watchKeyboard } from "../services/watch-keyboard";

export async function registerStartCommand(ctx: CommandContext<Context>) {
    try {
        const count = loadBloggers().length;
        const state = getWatchEnabled() ? "yoniq" : "o'chiq";
        await ctx.reply(`Bot ishlayapti.\nKuzatuv: ${state}\nKuzatilayotgan blogerlar: ${count} ta.\nYangi postlar belgilangan chatga yuboriladi.`, {
            reply_markup: watchKeyboard(),
        });
    } catch (error) {
        await sendErrorLog({ event: "Start bosganda", error, ctx });
    }
}
