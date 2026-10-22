import { describe, expect, test } from "bun:test";
import { diffNewShortcodes } from "./seen-posts";

describe("diffNewShortcodes", () => {
    test("birinchi ko'rishda xabar yo'q", () => {
        expect(diffNewShortcodes(undefined, ["new", "old"])).toEqual({ baseline: true, fresh: [] });
    });

    test("yangi shortcode larni eskidan yangiga qarab qaytaradi", () => {
        expect(diffNewShortcodes(["a", "b"], ["d", "e", "a"])).toEqual({ baseline: false, fresh: ["e", "d"] });
    });

    test("o'zgarish bo'lmasa bo'sh", () => {
        expect(diffNewShortcodes(["a"], ["a"])).toEqual({ baseline: false, fresh: [] });
    });
});
