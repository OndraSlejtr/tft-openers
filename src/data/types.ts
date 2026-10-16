export type Cost = 1 | 2 | 3 | 4 | 5;

export type Champion = {
  id: string;
  name: string;
  cost: Cost;
  // Game path of the icon, lowercased with a .png extension. Null when upstream has no usable icon.
  icon: string | null;
  // Ids of every source entry this champion stands for (more than one for Lux).
  variantIds: string[];
  traitIds: string[];
};

export type Trait = {
  id: string;
  name: string;
  // Game path of the icon, lowercased with a .png extension.
  icon: string;
};

export type ItemCategory = "AD" | "AP" | "tanky" | "utility";

export type AugmentCategory = "econ" | "item" | "combat" | "special";

export type ComponentSide = "frontline" | "backline" | "both";

export type Component = {
  id: string;
  name: string;
  icon: string;
  // Null when the curated mapping has no entry for this component.
  side: ComponentSide | null;
  // True when the side comes from the curated mapping and nobody confirmed it yet.
  guessed: boolean;
  // Ids of the completed items this component is part of.
  builtInto: string[];
};

export type CompletedItem = {
  id: string;
  name: string;
  icon: string;
  emblem: boolean;
  componentIds: [string, string];
  // Empty when the curated mapping has no entry for this item.
  categories: ItemCategory[];
  guessed: boolean;
};

export type Augment = {
  id: string;
  name: string;
  // Null for placeholder icons, the UI shows the name instead.
  icon: string | null;
  categories: AugmentCategory[];
  guessed: boolean;
};

export type DataBundle = {
  setNumber: number;
  patch: string;
  traits: Trait[];
  champions: Champion[];
  components: Component[];
  items: CompletedItem[];
  augments: Augment[];
};
