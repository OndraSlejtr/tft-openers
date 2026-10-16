import { useState } from "react";
import { Link } from "react-router";
import { useStoreState } from "./domain/useStore.ts";
import { AugmentIcon } from "./components/AugmentIcon.tsx";
import { CategoryToggle } from "./components/CategoryToggle.tsx";
import { bundle, iconUrl } from "./data/bundle.ts";
import { type CategoryStatus, categoryStatus } from "./data/categoryStatus.ts";

type StatusFilter = CategoryStatus | "all";

const FILTERS: StatusFilter[] = ["all", "guessed", "confirmed", "uncategorized"];


export const DataPage = () => {
  const { items: effectiveItems, augments: effectiveAugments } = useStoreState();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const matches = (entry: { categories: string[]; guessed: boolean }) =>
    filter === "all" || categoryStatus(entry) === filter;
  const items = effectiveItems.toSorted((a, b) => a.name.localeCompare(b.name)).filter(matches);
  const augments = effectiveAugments.toSorted((a, b) => a.name.localeCompare(b.name)).filter(matches);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Data</h1>
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">
          Back to champions
        </Link>
      </header>
      <p className="mb-4 text-sm text-gray-400">
        Set {bundle.setNumber}, patch {bundle.patch}. Changing a category confirms it.
      </p>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category status">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={`rounded border px-3 py-1 text-sm capitalize ${
              filter === option ? "border-white/60 bg-white/15" : "border-white/10 bg-black/40"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Items ({items.length})</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded border border-white/10 p-2">
              <img src={iconUrl(item.icon)} alt="" loading="lazy" className="size-10 shrink-0 rounded" />
              <div className="min-w-0">
                <p className="truncate text-sm">{item.name}</p>
                <CategoryToggle kind="item" id={item.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Augments ({augments.length})</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {augments.map((augment) => (
            <li key={augment.id} className="flex items-center gap-3 rounded border border-white/10 p-2">
              <AugmentIcon augment={augment} />
              <div className="min-w-0">
                <p className="truncate text-sm">{augment.name}</p>
                <CategoryToggle kind="augment" id={augment.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
