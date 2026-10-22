import type { Context } from "grammy";

export type ErrorLogOptions = {
    ctx?: Context;
    event: string;
    error: unknown;
};
