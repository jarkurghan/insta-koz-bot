import { autoRetry } from "@grammyjs/auto-retry";
import { Bot } from "grammy";
import { registerErrorHandler } from "./handlers/register-error-handler";
import { registerStartCommand } from "./handlers/register-start-command";
import { registerStatusCommand } from "./handlers/register-status-command";
import { registerWatchOff, registerWatchOn } from "./handlers/register-watch-command";
import { WATCH_OFF_TEXT, WATCH_ON_TEXT } from "./services/watch-keyboard";
import { BOT_TOKEN } from "./utils/constants";

if (!BOT_TOKEN) throw new Error("BOT_TOKEN topilmadi!");

export const bot = new Bot(BOT_TOKEN);

bot.api.config.use(autoRetry());
bot.command("start", registerStartCommand);
bot.command("status", registerStatusCommand);
bot.hears(WATCH_ON_TEXT, registerWatchOn);
bot.hears(WATCH_OFF_TEXT, registerWatchOff);
bot.catch(registerErrorHandler);
