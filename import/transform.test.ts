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

describe("transform traits", () => {
  const bundle = transform(sources);

  it("includes traits with lowercased png icons", () => {
    expect(bundle.traits).toContainEqual({
      id: "DA_18_Elderwood",
      name: "Elderwood",
      icon: "assets/ux/traiticons/trait_icon_18_elderwood.png",
    });
    expect(bundle.traits).toHaveLength(36);
  });

  it("references traits by id on each champion", () => {
    const azir = bundle.champions.find(({ id }) => id === "DA_18_Azir");
    expect(azir?.traitIds).toEqual(["DA_18_Blackthorn", "DA_18_Executioner", "DA_18_Summoner"]);
  });

  it("gives champions without traits an empty list", () => {
    const withoutTraits = structuredClone(cdragonFixture);
    const set18 = withoutTraits.setData.find(({ mutator }) => mutator === "TFTSet18")!;
    set18.champions.find(({ apiName }) => apiName === "DA_18_Azir")!.traits = [];
    const azir = transform({ ...sources, cdragon: withoutTraits }).champions.find(({ id }) => id === "DA_18_Azir");
    expect(azir?.traitIds).toEqual([]);
  });

  it("keeps the base Lux traits when variants collapse", () => {
    const lux = bundle.champions.find(({ id }) => id === "DA_Lux18_Base");
    expect(lux?.traitIds).toEqual(["DA_18_LuxUniqueTrait"]);
  });

  it("fails when a champion references an unknown trait", () => {
    const broken = structuredClone(cdragonFixture);
    const set18 = broken.setData.find(({ mutator }) => mutator === "TFTSet18")!;
    set18.champions.find(({ apiName }) => apiName === "DA_18_Azir")!.traits.push("Nonexistent");
    expect(() => transform({ ...sources, cdragon: broken })).toThrow(/unknown trait "Nonexistent"/);
  });

  it("fails when the trait list is missing", () => {
    const broken = structuredClone(cdragonFixture) as { setData: Record<string, unknown>[] };
    Reflect.deleteProperty(broken.setData[1], "traits");
    expect(() => transform({ ...sources, cdragon: broken })).toThrow(/traits/);
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

type FixtureEntry = { apiName: string; name?: string; desc?: string; composition: string[]; associatedTraits: string[]; icon: string };

// Returns a copy of the fixture with changes applied to the catalog entry and the set lists.
const withCatalog = (change: (items: FixtureEntry[], set18: { items: string[]; augments: string[] }) => void) => {
  const copy = structuredClone(cdragonFixture) as unknown as {
    items: FixtureEntry[];
    setData: { mutator: string; items: string[]; augments: string[] }[];
  };
  change(copy.items, copy.setData.find(({ mutator }) => mutator === "TFTSet18")!);
  return { ...sources, cdragon: copy };
};

const entryOf = (items: FixtureEntry[], apiName: string) => items.find((item) => item.apiName === apiName)!;

describe("transform components", () => {
  const { components } = transform(sources);

  it("includes only the Set 18 components with their icons", () => {
    expect(components).toHaveLength(10);
    expect(components.every(({ id }) => id.startsWith("DA_Component_"))).toBe(true);
    expect(components.find(({ id }) => id === "DA_Component_BFSword")?.icon).toMatch(/tft_item_bfsword\.png$/);
  });

  it("links each component to the completed items it builds into", () => {
    const rod = components.find(({ id }) => id === "DA_Component_NeedlesslyLargeRod");
    expect(rod?.builtInto).toEqual(
      expect.arrayContaining(["DA_GuinsoosRageblade", "DA_RabadonsDeathcap", "DA_18_EmblemBlossom"]),
    );
    expect(rod?.builtInto).not.toContain("DA_WarmogsArmor");
  });

  it("lists a component once for items built from two copies of it", () => {
    const belt = components.find(({ id }) => id === "DA_Component_GiantsBelt");
    expect(belt?.builtInto.filter((id) => id === "DA_WarmogsArmor")).toHaveLength(1);
  });

  it("marks curated sides as guessed", () => {
    const chainVest = components.find(({ id }) => id === "DA_Component_ChainVest");
    expect(chainVest).toMatchObject({ side: "frontline", guessed: true });
  });

  it("leaves a component without curation uncategorized", () => {
    const uncurated = withCatalog((catalog, set18) => {
      const rod = entryOf(catalog, "DA_Component_NeedlesslyLargeRod");
      rod.apiName = "DA_Component_NewThing";
      set18.items = set18.items.map((id) => (id === "DA_Component_NeedlesslyLargeRod" ? "DA_Component_NewThing" : id));
      for (const item of catalog) item.composition = item.composition.map((id) => (id === "DA_Component_NeedlesslyLargeRod" ? "DA_Component_NewThing" : id));
    });
    const component = transform(uncurated).components.find(({ id }) => id === "DA_Component_NewThing");
    expect(component).toMatchObject({ side: null, guessed: false });
  });
});

describe("transform completed items", () => {
  const { items } = transform(sources);

  it("keeps craftable items and emblems with their recipes", () => {
    const rageblade = items.find(({ id }) => id === "DA_GuinsoosRageblade");
    expect(rageblade).toMatchObject({
      emblem: false,
      componentIds: ["DA_Component_RecurveBow", "DA_Component_NeedlesslyLargeRod"],
    });
    expect(items.find(({ id }) => id === "DA_18_EmblemBlossom")?.emblem).toBe(true);
  });

  it("excludes radiants, consumables and legacy items", () => {
    const ids = items.map(({ id }) => id);
    expect(ids).not.toContain("DA_GuinsoosRagebladeRadiant");
    expect(ids).not.toContain("DA_Consumable_ItemRemover");
    expect(ids).not.toContain("TFT_Item_GuinsoosRageblade");
  });

  it("excludes artifacts even when they carry a recipe", () => {
    const withRecipe = withCatalog((catalog, set18) => {
      const artifact = entryOf(catalog, "DA_Artifact_Fishbones");
      artifact.composition = ["DA_Component_RecurveBow", "DA_Component_BFSword"];
      set18.items.push("DA_Artifact_Fishbones");
    });
    expect(transform(withRecipe).items.map(({ id }) => id)).not.toContain("DA_Artifact_Fishbones");
  });

  it("excludes radiants even when they carry a recipe", () => {
    const withRecipe = withCatalog((catalog) => {
      entryOf(catalog, "DA_GuinsoosRagebladeRadiant").composition = ["DA_Component_RecurveBow", "DA_Component_BFSword"];
    });
    expect(transform(withRecipe).items.map(({ id }) => id)).not.toContain("DA_GuinsoosRagebladeRadiant");
  });

  it("pre-fills curated categories and marks them guessed", () => {
    expect(items.find(({ id }) => id === "DA_GuinsoosRageblade")).toMatchObject({
      categories: ["AD", "AP"],
      guessed: true,
    });
    expect(items.find(({ id }) => id === "DA_RabadonsDeathcap")?.categories).toEqual(["AP"]);
    expect(items.find(({ id }) => id === "DA_WarmogsArmor")?.categories).toEqual(["tanky"]);
  });

  it("categorizes emblems as utility", () => {
    expect(items.find(({ id }) => id === "DA_18_EmblemBlossom")).toMatchObject({ categories: ["utility"], guessed: true });
  });

  it("imports items without curation as uncategorized", () => {
    const uncurated = withCatalog((catalog, set18) => {
      entryOf(catalog, "DA_InfinityEdge").apiName = "DA_BrandNewItem";
      set18.items = set18.items.map((id) => (id === "DA_InfinityEdge" ? "DA_BrandNewItem" : id));
    });
    const item = transform(uncurated).items.find(({ id }) => id === "DA_BrandNewItem");
    expect(item).toMatchObject({ categories: [], guessed: false });
  });

  it("fails when a recipe references an unknown component", () => {
    const broken = withCatalog((catalog) => {
      entryOf(catalog, "DA_GuinsoosRageblade").composition = ["DA_Component_Nope", "DA_Component_BFSword"];
    });
    expect(() => transform(broken)).toThrow(/unknown component DA_Component_Nope/);
  });

  it("fails when a set item is missing from the item list", () => {
    const broken = withCatalog((_, set18) => {
      set18.items.push("DA_Missing");
    });
    expect(() => transform(broken)).toThrow(/unknown id DA_Missing/);
  });
});

describe("transform augments", () => {
  const { augments } = transform(sources);
  const augmentOf = (id: string) => augments.find((augment) => augment.id === id);

  // Replaces one fixture augment's text so each wording bucket is tested on its own.
  const guessFor = (text: { name?: string; desc: string }) => {
    const changed = withCatalog((catalog) => {
      const entry = entryOf(catalog, "DA_18_ResidualMagic");
      entry.desc = text.desc;
      if (text.name !== undefined) entry.name = text.name;
    });
    return transform(changed).augments.find(({ id }) => id === "DA_18_ResidualMagic");
  };

  it("includes every augment of the set", () => {
    expect(augments).toHaveLength(9);
  });

  it("marks every category as guessed", () => {
    expect(augments.every(({ guessed, categories }) => guessed && categories.length === 1)).toBe(true);
  });

  it("makes augments with associated traits special", () => {
    expect(augmentOf("DA_18_BlossomTraitAugment")?.categories).toEqual(["special"]);
  });

  it("makes augments tied to a hero special", () => {
    expect(augmentOf("TFT9_Augment_DravenSpoilsOfWar")?.categories).toEqual(["special"]);
  });

  it("keeps special ahead of wording", () => {
    const changed = withCatalog((catalog) => {
      entryOf(catalog, "DA_18_BlossomTraitAugment").desc = "Gain 10 gold.";
    });
    expect(transform(changed).augments.find(({ id }) => id === "DA_18_BlossomTraitAugment")?.categories).toEqual(["special"]);
  });

  it("guesses econ from gold wording", () => {
    expect(guessFor({ desc: "Gain <b>@Amount@</b> gold now." })?.categories).toEqual(["econ"]);
  });

  it("guesses econ from interest wording", () => {
    expect(guessFor({ desc: "You earn more interest." })?.categories).toEqual(["econ"]);
  });

  it("guesses econ from XP wording", () => {
    expect(guessFor({ desc: "Gain 8 XP." })?.categories).toEqual(["econ"]);
  });

  it("guesses item from component wording", () => {
    expect(guessFor({ desc: "Gain a random component." })?.categories).toEqual(["item"]);
  });

  it("guesses item from item wording", () => {
    expect(guessFor({ desc: "Your item holders deal more damage." })?.categories).toEqual(["item"]);
  });

  it("prefers econ over item when both wordings appear", () => {
    expect(guessFor({ desc: "Gain 3 random components and 10 gold." })?.categories).toEqual(["econ"]);
  });

  it("guesses combat for everything else", () => {
    expect(guessFor({ desc: "Your team gains 10% attack speed." })?.categories).toEqual(["combat"]);
  });

  it("ignores wording inside variable placeholders", () => {
    expect(guessFor({ desc: "Your team gains @GoldBonus@ attack speed." })?.categories).toEqual(["combat"]);
  });

  it("does not read part of a word as a keyword", () => {
    expect(guessFor({ desc: "Heroic itemization of golden xps." })?.categories).toEqual(["combat"]);
  });

  it("falls back to no icon for placeholder icons", () => {
    expect(augmentOf("DA_18_WispRebatePlus")?.icon).toBeNull();
    expect(augmentOf("DA_AdvancedLoan")?.icon).toMatch(/\.png$/);
  });

  it("fails when an augment is missing from the item list", () => {
    const broken = withCatalog((_, set18) => {
      set18.augments.push("DA_Missing");
    });
    expect(() => transform(broken)).toThrow(/unknown id DA_Missing/);
  });
});
