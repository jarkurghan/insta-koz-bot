import { describe, expect, test } from "bun:test";
import { postUrl, postsFromHrefs } from "./instagram";

describe("postsFromHrefs", () => {
    test("birinchi 12 ta p va reel ni tartibda oladi", () => {
        const hrefs = [
            "/cristiano/p/AAA111/",
            "/cristiano/p/AAA111/?img_index=1",
            "/reel/BBB222/",
            "https://www.instagram.com/p/CCC333/",
        ];
        expect(postsFromHrefs(hrefs)).toEqual([
            { shortcode: "AAA111", kind: "p" },
            { shortcode: "BBB222", kind: "reel" },
            { shortcode: "CCC333", kind: "p" },
        ]);
        expect(postUrl({ shortcode: "BBB222", kind: "reel" })).toBe("https://www.instagram.com/reel/BBB222/");
    });
});
