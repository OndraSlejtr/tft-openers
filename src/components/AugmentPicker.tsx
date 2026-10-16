import { useState } from "react";
import { bundle } from "../data/bundle.ts";
import { filterByText } from "../domain/filterByText.ts";
import { AugmentIcon } from "./AugmentIcon.tsx";

const sortedAugments = bundle.augments.toSorted((a, b) => a.name.localeCompare(b.name));
const augmentsById = new Map(bundle.augments.map((augment) => [augment.id, augment]));

const MAX_RESULTS = 20;

type AugmentPickerProps = {
  selectedAugmentIds: readonly string[];
  onAdd: (augmentId: string) => void;
  onRemove: (augmentId: string) => void;
};

export const AugmentPicker = ({ selectedAugmentIds, onAdd, onRemove }: AugmentPickerProps) => {
  const [searchText, setSearchText] = useState("");
  const results = searchText.trim() === ""
    ? []
    : filterByText(sortedAugments, searchText, ({ name }) => name).filter(({ id }) => !selectedAugmentIds.includes(id));

  return (
    <section aria-label="Key augments">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Key augments</h3>
      <ul className="mb-2 flex flex-wrap gap-2">
        {selectedAugmentIds.map((augmentId) => {
          const augment = augmentsById.get(augmentId);
          return (
            <li key={augmentId} className="flex items-center gap-2 rounded border border-white/10 py-1 pl-1 pr-2 text-sm">
              {augment && <AugmentIcon augment={augment} />}
              <span>{augment?.name ?? augmentId}</span>
              <button type="button" aria-label={`Remove ${augment?.name ?? augmentId}`} onClick={() => onRemove(augmentId)} className="text-gray-400 hover:text-red-400">
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <input
        type="search"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Search augments to add"
        aria-label="Search augments"
        className="mb-2 w-full rounded border border-white/10 bg-black/40 px-3 py-1.5 text-sm"
      />
      <ul className="flex flex-col gap-1">
        {results.slice(0, MAX_RESULTS).map((augment) => (
          <li key={augment.id}>
            <button type="button" onClick={() => onAdd(augment.id)} className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-sm hover:bg-white/10">
              <AugmentIcon augment={augment} />
              {augment.name}
            </button>
          </li>
        ))}
      </ul>
      {results.length > MAX_RESULTS && <p className="mt-1 text-xs text-gray-400">Showing {MAX_RESULTS} of {results.length}, refine the search.</p>}
    </section>
  );
};
