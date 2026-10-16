import { useState } from "react";
import type { AugmentCategory, ItemCategory } from "../data/types.ts";
import { categoryStatus } from "../data/categoryStatus.ts";
import { store, useStoreState } from "../domain/useStore.ts";

export type CategoryKind = "item" | "augment";

const ITEM_CATEGORIES: ItemCategory[] = ["AD", "AP", "tanky", "utility"];
const AUGMENT_CATEGORIES: AugmentCategory[] = ["econ", "item", "combat", "special"];

type CategoryToggleProps = {
  kind: CategoryKind;
  id: string;
};

// Toggle buttons for one item or augment. Any change stores an override and confirms the categories.
export const CategoryToggle = ({ kind, id }: CategoryToggleProps) => {
  const { items, augments } = useStoreState();
  const entry = (kind === "item" ? items : augments).find((candidate) => candidate.id === id);
  if (entry === undefined) return <p className="text-xs text-gray-400">Not in the current data.</p>;

  const options: readonly string[] = kind === "item" ? ITEM_CATEGORIES : AUGMENT_CATEGORIES;
  const current: readonly string[] = entry.categories;
  const toggle = (category: string) => {
    const next = current.includes(category) ? current.filter((value) => value !== category) : [...current, category];
    if (kind === "item") store.setItemCategories(id, next as ItemCategory[]);
    else store.setAugmentCategories(id, next as AugmentCategory[]);
  };
  const clear = () => (kind === "item" ? store.clearItemCategories(id) : store.clearAugmentCategories(id));
  const status = categoryStatus(entry);

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {options.map((category) => (
        <button
          key={category}
          type="button"
          aria-pressed={current.includes(category)}
          onClick={() => toggle(category)}
          className={`rounded border px-1.5 py-0.5 ${current.includes(category) ? "border-white/60 bg-white/20" : "border-white/10 bg-black/40"}`}
        >
          {category}
        </button>
      ))}
      <span className={status === "uncategorized" ? "text-amber-400" : "text-gray-400"}>{status}</span>
      {!entry.guessed && (
        <button type="button" onClick={clear} className="text-gray-400 underline hover:text-gray-200">
          Clear
        </button>
      )}
    </div>
  );
};

// Wraps any chip. Clicking it opens the category toggle below it.
export const CategoryPopover = ({ kind, id, children }: CategoryToggleProps & { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="text-left">
        {children}
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close categories" onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute left-0 top-full z-20 mt-1 w-max max-w-64 rounded border border-white/10 bg-gray-900 p-2 shadow-lg">
            <CategoryToggle kind={kind} id={id} />
          </div>
        </>
      )}
    </span>
  );
};
