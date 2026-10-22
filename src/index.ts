import { bot } from "./bot";
import { loadBloggers } from "./services/parse-bloggers";
import { watchBloggers } from "./scheduler/watch-bloggers";
import { assertConfig } from "./utils/constants";

assertConfig();
loadBloggers();

void bot.start({
    onStart: (me) => {
        console.log(`Bot @${me.username} ishga tushdi`);
    },
}).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});

void watchBloggers();
