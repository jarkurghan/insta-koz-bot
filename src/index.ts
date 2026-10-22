import { bot } from "./bot";
import { parseBloggers } from "./services/parse-bloggers";
import { watchBloggers } from "./scheduler/watch-bloggers";
import { assertConfig, BLOGGERS_RAW } from "./utils/constants";

assertConfig();
parseBloggers(BLOGGERS_RAW);

void bot.start({
    onStart: (me) => {
        console.log(`Bot @${me.username} ishga tushdi`);
    },
}).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});

void watchBloggers();
