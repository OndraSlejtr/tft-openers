import { useState } from "react";
import { bundle } from "../data/bundle.ts";
import { filterByText } from "../domain/filterByText.ts";

const sortedComps = bundle.comps.toSorted((a, b) => a.title.localeCompare(b.title));
const compsBySlug = new Map(bundle.comps.map((comp) => [comp.slug, comp]));

const MAX_RESULTS = 20;

type CompPickerProps = {
  linkedCompSlugs: readonly string[];
  onLink: (compSlug: string) => void;
  onUnlink: (compSlug: string) => void;
};

export const CompPicker = ({ linkedCompSlugs, onLink, onUnlink }: CompPickerProps) => {
  const [searchText, setSearchText] = useState("");
  const results = searchText.trim() === ""
    ? []
    : filterByText(sortedComps, searchText, ({ title }) => title).filter(({ slug }) => !linkedCompSlugs.includes(slug));

  return (
    <section aria-label="Linked comps">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Linked comps</h3>
      <ul className="mb-2 flex flex-col gap-1">
        {linkedCompSlugs.map((slug) => {
          const comp = compsBySlug.get(slug);
          return (
            <li key={slug} className="flex items-center gap-2 rounded border border-white/10 px-2 py-1 text-sm">
              {comp && <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs font-semibold">Tier {comp.tier}</span>}
              <span className="truncate">{comp?.title ?? slug}</span>
              <button type="button" aria-label={`Unlink ${comp?.title ?? slug}`} onClick={() => onUnlink(slug)} className="ml-auto text-gray-400 hover:text-red-400">
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
        placeholder="Search comps to link"
        aria-label="Search comps"
        className="mb-2 w-full rounded border border-white/10 bg-black/40 px-3 py-1.5 text-sm"
      />
      <ul className="flex flex-col gap-1">
        {results.slice(0, MAX_RESULTS).map((comp) => (
          <li key={comp.slug}>
            <button type="button" onClick={() => onLink(comp.slug)} className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-sm hover:bg-white/10">
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs font-semibold">Tier {comp.tier}</span>
              {comp.title}
            </button>
          </li>
        ))}
      </ul>
      {results.length > MAX_RESULTS && <p className="mt-1 text-xs text-gray-400">Showing {MAX_RESULTS} of {results.length}, refine the search.</p>}
    </section>
  );
};
