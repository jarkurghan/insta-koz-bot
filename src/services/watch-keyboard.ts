import { Keyboard } from "grammy";

export const WATCH_ON_TEXT = "Kuzatuvni yoqish";
export const WATCH_OFF_TEXT = "Kuzatuvni o'chirish";

export function watchKeyboard() {
    return new Keyboard().text(WATCH_ON_TEXT).text(WATCH_OFF_TEXT).resized().persistent();
}
