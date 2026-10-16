import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { iconUrl } from "../data/bundle.ts";
import { bundle } from "../data/bundle.ts";
import type { CompletedItem } from "../data/types.ts";
import { filterByText } from "../domain/filterByText.ts";

const sortedItems = bundle.items.toSorted((a, b) => a.name.localeCompare(b.name));

const DraggableItem = ({ item }: { item: CompletedItem }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `item:${item.id}`, data: { itemId: item.id } });
  return (
    <button type="button" ref={setNodeRef} {...attributes} {...listeners} title={item.name} className={`touch-none ${isDragging ? "opacity-40" : ""}`}>
      <img src={iconUrl(item.icon)} alt={item.name} loading="lazy" className="size-9 rounded" />
    </button>
  );
};

export const ItemPalette = () => {
  const [searchText, setSearchText] = useState("");
  return (
    <section aria-label="Items">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Items, drag onto a champion</h3>
      <input
        type="search"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Search items"
        aria-label="Search items"
        className="mb-2 w-full rounded border border-white/10 bg-black/40 px-3 py-1.5 text-sm"
      />
      <ul className="flex max-h-48 flex-wrap gap-1 overflow-y-auto">
        {filterByText(sortedItems, searchText, ({ name }) => name).map((item) => (
          <li key={item.id}>
            <DraggableItem item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
};
