import { describe, expect, it } from "vitest";
import { getMediaTypeByExtension } from "@/lib/media";

describe("media helpers", () => {
  it("recognizes images and videos", () => {
    expect(getMediaTypeByExtension("hello.jpg")).toBe("IMAGE");
    expect(getMediaTypeByExtension("hello.mp4")).toBe("VIDEO");
  });
});
