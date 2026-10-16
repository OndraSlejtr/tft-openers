export type Cost = 1 | 2 | 3 | 4 | 5;

export type Champion = {
  id: string;
  name: string;
  cost: Cost;
  // Game path of the icon, lowercased with a .png extension.
  icon: string;
  // Ids of every source entry this champion stands for (more than one for Lux).
  variantIds: string[];
};

export type DataBundle = {
  setNumber: number;
  patch: string;
  champions: Champion[];
};
