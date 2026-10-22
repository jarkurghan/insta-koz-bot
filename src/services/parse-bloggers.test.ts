import { describe, expect, test } from "bun:test";
import { parseBloggers } from "./parse-bloggers";

describe("parseBloggers", () => {
    test("vergul, @ va takrorni tozalaydi", () => {
        expect(parseBloggers(" @Cristiano, natgeo,nasa, @NatGeo ")).toEqual(["cristiano", "natgeo", "nasa"]);
    });

    test("noto'g'ri username da xato beradi", () => {
        expect(() => parseBloggers("good, bad name")).toThrow(/noto'g'ri username/);
    });

    test("bo'sh ro'yxatda xato beradi", () => {
        expect(() => parseBloggers(" , ")).toThrow(/bo'sh/);
    });
});
