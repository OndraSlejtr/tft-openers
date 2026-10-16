import { describe, expect, it, vi } from "vitest";
import academyFixture from "./fixtures/academy.json" with { type: "json" };
import cdragonFixture from "./fixtures/cdragon.json" with { type: "json" };

vi.mock("./curation.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./curation.ts")>()),
  AUGMENT_CATEGORY_OVERRIDES: { DA_AdvancedLoan: ["item", "combat"] },
  EXCLUDED_ITEM_IDS: ["DA_InfinityEdge"],
}));

const { transform } = await import("./transform.ts");

const bundle = transform({ cdragon: cdragonFixture, academy: academyFixture });

describe("manual overrides", () => {
  it("applies an augment category override", () => {
    expect(bundle.augments.find(({ id }) => id === "DA_AdvancedLoan")).toMatchObject({
      categories: ["item", "combat"],
      guessed: true,
    });
  });

  it("leaves other augments to the guessing rules", () => {
    expect(bundle.augments.find(({ id }) => id === "DA_18_BigGrabBag")?.categories).toEqual(["econ"]);
  });

  it("drops an item listed as excluded", () => {
    expect(bundle.items.map(({ id }) => id)).not.toContain("DA_InfinityEdge");
    expect(bundle.items.map(({ id }) => id)).toContain("DA_SteraksGage");
  });
});
