import { GrammyError } from "grammy";
import { bot } from "../bot";
import type { ErrorLogOptions } from "../utils/types";
import { LOG_CHAT_ID, NOTIFY_CHAT_ID } from "../utils/constants";

export async function sendLog(message: string): Promise<void> {
    try {
        if (!LOG_CHAT_ID) {
            console.error(message);
            return;
        }
        await bot.api.sendMessage(LOG_CHAT_ID, message);
    } catch (error) {
        console.error("Log yuborilmadi:", error);
    }
}

export async function sendNotify(message: string): Promise<void> {
    await bot.api.sendMessage(NOTIFY_CHAT_ID, message, { parse_mode: "HTML" });
}

export async function sendErrorLog(options: ErrorLogOptions): Promise<void> {
    try {
        const { ctx, event, error } = options;
        let detail = "";
        if (error instanceof GrammyError) {
            detail = error.description || error.message;
        } else if (error instanceof Error) {
            detail = error.stack || error.message;
        } else {
            detail = String(error);
        }

        const lines = [`Xatolik`, `Qayerda: ${event}`, detail];
        const from = ctx?.from;
        if (from) {
            lines.push(`User ID: ${from.id}`);
        }
        await sendLog(lines.join("\n"));
    } catch (error) {
        console.error("System error:", error);
    }
}
