import { describe, it, expect } from "vitest";
import { slugify } from "./upload";

describe("slugify", () => {
  it("should convert text to a URL-friendly slug", () => {
    expect(slugify("Công ty Cổ phần Công nghệ ABC")).toBe("cong-ty-co-phan-cong-nghe-abc");
    expect(slugify("  Hello   World  ")).toBe("hello-world");
  });

  it("should handle special characters and accents correctly", () => {
    expect(slugify("Đường dẫn (slug) %$#@!")).toBe("duong-dan-slug");
    expect(slugify("Việt Nam Vô Địch!!!")).toBe("viet-nam-vo-dich");
  });

  it("should return 'business' if input is empty", () => {
    expect(slugify("")).toBe("business");
    expect(slugify(null as any)).toBe("business");
  });
});
