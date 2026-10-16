import { describe, expect, it, vi } from "vitest";
import type { Comp, DataBundle } from "../data/types.ts";
import { createStore } from "./store.ts";

const champion = (id: string) => ({ id, name: id, cost: 1 as const, icon: null, variantIds: [id], traitIds: [] });

const comp = (slug: string, tier: string, finalChampionIds: string[], earlyChampionIds: string[] = []): Comp => ({
  slug,
  title: slug,
  tier,
  style: "Fast 8",
  difficulty: "EASY",
  mainChampionId: finalChampionIds[0],
  earlyBoard: earlyChampionIds.map((championId) => ({ championId, itemIds: [], stars: 1 })),
  finalBoard: finalChampionIds.map((championId) => ({ championId, itemIds: [], stars: 1 })),
  carouselItemIds: [],
  augmentIds: [],
  augmentTypes: [],
  stageTips: [],
  updated: "",
});

const bundle: DataBundle = {
  setNumber: 18,
  patch: "18.4b",
  traits: [],
  champions: ["azir", "karma", "teemo", "lux"].map(champion),
  components: [],
  items: [],
  augments: [],
  comps: [
    comp("azir-reroll", "A", ["azir", "teemo"]),
    comp("azir-karma", "S", ["azir", "karma"]),
    comp("azir-b", "B", ["azir"]),
    comp("early-only", "S", ["lux"], ["karma"]),
  ],
};

const slugs = (store: ReturnType<typeof createStore>) => store.compsWithSelectedChampions().map(({ comp: { slug } }) => slug);

describe("selection", () => {
  it("starts empty", () => {
    expect(createStore(bundle).getState().selectedChampionIds).toEqual([]);
  });

  it("toggles a champion on and off", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    expect(store.getState().selectedChampionIds).toEqual(["azir"]);
    store.toggleChampion("azir");
    expect(store.getState().selectedChampionIds).toEqual([]);
  });

  it("clears all selected champions in one action", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    store.toggleChampion("karma");
    store.clearSelection();
    expect(store.getState().selectedChampionIds).toEqual([]);
  });

  it("rejects an unknown champion", () => {
    expect(() => createStore(bundle).toggleChampion("nobody")).toThrow(/Unknown champion id "nobody"/);
  });

  it("notifies subscribers on change until they unsubscribe", () => {
    const store = createStore(bundle);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.toggleChampion("azir");
    store.clearSelection();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.toggleChampion("karma");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not notify when clearing an empty selection", () => {
    const store = createStore(bundle);
    const listener = vi.fn();
    store.subscribe(listener);
    store.clearSelection();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("comps with selected champions", () => {
  it("returns nothing without a selection", () => {
    expect(slugs(createStore(bundle))).toEqual([]);
  });

  it("lists comps whose final board has any selected champion", () => {
    const store = createStore(bundle);
    store.toggleChampion("teemo");
    expect(slugs(store)).toEqual(["azir-reroll"]);
  });

  it("ignores champions that are only on the early board", () => {
    const store = createStore(bundle);
    store.toggleChampion("karma");
    expect(slugs(store)).toEqual(["azir-karma"]);
  });

  it("reports which selected champions matched", () => {
    const store = createStore(bundle);
    store.toggleChampion("karma");
    store.toggleChampion("azir");
    const [first] = store.compsWithSelectedChampions();
    expect(first.comp.slug).toBe("azir-karma");
    expect(first.matchedChampionIds).toEqual(["karma", "azir"]);
  });

  it("orders by matches, then tier", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    store.toggleChampion("karma");
    expect(slugs(store)).toEqual(["azir-karma", "azir-reroll", "azir-b"]);
  });

  it("updates when the selection changes", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    store.toggleChampion("azir");
    expect(slugs(store)).toEqual([]);
  });
});
