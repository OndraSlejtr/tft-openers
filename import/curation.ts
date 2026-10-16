import type { AugmentCategory, ComponentSide, ItemCategory } from "../src/data/types.ts";

// Hand curated starting points. Every entry is imported as guessed until the user confirms it in the app.
// Items missing here are imported without categories.

export const COMPONENT_SIDES: Record<string, ComponentSide> = {
  DA_Component_BFSword: "both",
  DA_Component_ChainVest: "frontline",
  DA_Component_FryingPan: "frontline",
  DA_Component_GiantsBelt: "frontline",
  DA_Component_NeedlesslyLargeRod: "backline",
  DA_Component_NegatronCloak: "frontline",
  DA_Component_RecurveBow: "backline",
  DA_Component_SparringGloves: "both",
  DA_Component_Spatula: "both",
  DA_Component_TearOfTheGoddess: "backline",
};

export const ITEM_CATEGORIES: Record<string, ItemCategory[]> = {
  DA_AdaptiveHelm: ["tanky", "utility"],
  DA_ArchangelsStaff: ["AP"],
  DA_BlueBuff: ["AP"],
  DA_Bloodthirster: ["AD"],
  DA_BrambleVest: ["tanky"],
  DA_Crownguard: ["AP"],
  DA_Deathblade: ["AD"],
  DA_DragonsClaw: ["tanky"],
  DA_EdgeOfNight: ["AD", "tanky"],
  DA_Evenshroud: ["tanky", "utility"],
  DA_GargoyleStoneplate: ["tanky"],
  DA_GiantSlayer: ["AD"],
  DA_GuinsoosRageblade: ["AD", "AP"],
  DA_HandOfJustice: ["AD", "AP"],
  DA_HextechGunblade: ["AD", "AP"],
  DA_InfinityEdge: ["AD"],
  DA_IonicSpark: ["AP"],
  DA_JeweledGauntlet: ["AD", "AP"],
  DA_KrakensFury: ["AD"],
  DA_LastWhisper: ["AD"],
  DA_Morellonomicon: ["AP"],
  DA_NashorsTooth: ["AP"],
  DA_ProtectorsVow: ["tanky"],
  DA_Quicksilver: ["AD"],
  DA_RabadonsDeathcap: ["AP"],
  DA_RedBuff: ["AD"],
  DA_SpearOfShojin: ["AD", "AP"],
  DA_SpiritVisage: ["tanky"],
  DA_SteadfastHeart: ["tanky"],
  DA_SteraksGage: ["AD", "tanky"],
  DA_StrikersFlail: ["AD"],
  DA_SunfireCape: ["tanky"],
  DA_TacticiansCape: ["utility"],
  DA_TacticiansCrown: ["utility"],
  DA_TacticiansShield: ["utility"],
  DA_ThiefsGloves: ["AD", "AP"],
  DA_TitansResolve: ["AD", "AP"],
  DA_VoidStaff: ["AP"],
  DA_WarmogsArmor: ["tanky"],
};

// Emblems only grant a trait.
export const EMBLEM_CATEGORIES: ItemCategory[] = ["utility"];

// Forces the categories of an augment when the wording rules get it wrong. Keyed by augment id.
export const AUGMENT_CATEGORY_OVERRIDES: Record<string, AugmentCategory[]> = {};

// Items to leave out although they look like craftable items. Keyed by item id.
export const EXCLUDED_ITEM_IDS: string[] = [];

// Units on tftacademy boards that are not champions, for example trait plants. They are left out of the boards.
// Any other unknown unit fails the import.
export const IGNORED_UNIT_IDS: string[] = [
  "DA_Elderwood18_Lifeblossom",
  "DA_Elderwood18_Protector",
  "DA_Elderwood18_StonebarkTree",
];
