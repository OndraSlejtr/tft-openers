import { describe, expect, it } from "vitest";
import academyFixture from "./fixtures/academy.json" with { type: "json" };
import cdragonFixture from "./fixtures/cdragon.json" with { type: "json" };
import { ImportError } from "./shape.ts";
import { transform } from "./transform.ts";

// The fixtures are trimmed snapshots of the real Community Dragon and tftacademy responses.
const sources = { cdragon: cdragonFixture, academy: academyFixture };

describe("transform", () => {
  const bundle = transform(sources);

  it("selects Set 18 and reads the patch from tftacademy", () => {
    expect(bundle.setNumber).toBe(18);
    expect(bundle.patch).toBe("18.4b");
  });

  it("keeps only shop champions", () => {
    const ids = bundle.champions.map(({ id }) => id);
    expect(ids).not.toContain("TFT_TrainingDummy");
    expect(ids).not.toContain("TFT_BlueGolem");
    expect(ids).not.toContain("TFT5_EmblemArmoryKey");
    expect(ids).not.toContain("TFT6_MercenaryChest");
    expect(ids).toContain("DA_18_Azir");
  });

  it("collapses Lux variants into one champion that remembers its variant ids", () => {
    const luxes = bundle.champions.filter(({ name }) => name.startsWith("Lux"));
    expect(luxes).toHaveLength(1);
    expect(luxes[0]).toMatchObject({ id: "DA_Lux18_Base", name: "Lux", cost: 5 });
    expect(luxes[0].variantIds).toEqual(["DA_Lux18_Base", "DA_Lux18_Blackthorn", "DA_18_Lux_Fae"]);
  });

  it("gives other champions only their own id as variant", () => {
    const azir = bundle.champions.find(({ id }) => id === "DA_18_Azir");
    expect(azir?.variantIds).toEqual(["DA_18_Azir"]);
  });

  it("lowercases icon paths and swaps the extension", () => {
    const azir = bundle.champions.find(({ id }) => id === "DA_18_Azir");
    expect(azir?.icon).toBe("assets/characters/tft18_azir/tft18_azir_square.png");
  });

  it("sorts champions by cost then name", () => {
    const keys = bundle.champions.map(({ cost, name }) => [cost, name] as const);
    expect(keys).toEqual(keys.toSorted(([costA, nameA], [costB, nameB]) => costA - costB || nameA.localeCompare(nameB)));
  });

  it("includes the cost 5 unit Elder Dragon", () => {
    expect(bundle.champions.find(({ id }) => id === "DA_18_ElderDragon")?.cost).toBe(5);
  });
});

describe("transform failures", () => {
  it("fails when Set 18 is missing", () => {
    const withoutSet18 = { setData: cdragonFixture.setData.filter(({ mutator }) => mutator !== "TFTSet18") };
    expect(() => transform({ ...sources, cdragon: withoutSet18 })).toThrow(ImportError);
  });

  it("fails when the source shape changes", () => {
    expect(() => transform({ ...sources, cdragon: { sets: {} } })).toThrow(/setData/);
    expect(() => transform({ ...sources, cdragon: null })).toThrow(ImportError);
  });

  it("fails when a champion has no cost", () => {
    const broken = structuredClone(cdragonFixture);
    const set18 = broken.setData.find(({ mutator }) => mutator === "TFTSet18")!;
    Reflect.deleteProperty(set18.champions[0], "cost");
    expect(() => transform({ ...sources, cdragon: broken })).toThrow(/cost/);
  });

  it("fails when the tftacademy patch is missing", () => {
    expect(() => transform({ ...sources, academy: { nodes: [] } })).toThrow(ImportError);
    expect(() => transform({ ...sources, academy: null })).toThrow(ImportError);
  });
});
