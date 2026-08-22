import { describe, expect, it, vi } from "vitest";
import { resolveBuildId } from "../../config/build-id";

describe("resolveBuildId", () => {
  it("prefers a trimmed environment override", () => {
    const readGitBuildId = vi.fn(() => "abc1234");

    expect(resolveBuildId("  release-candidate.9  ", readGitBuildId)).toBe("release-candidate.9");
    expect(readGitBuildId).not.toHaveBeenCalled();
  });

  it("uses the trimmed Git short SHA without an override", () => {
    expect(resolveBuildId(undefined, () => "  abc1234\n")).toBe("abc1234");
  });

  it("uses local when Git is unavailable", () => {
    expect(resolveBuildId("  ", () => { throw new Error("git unavailable"); })).toBe("local");
  });
});
