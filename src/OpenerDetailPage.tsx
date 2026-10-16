import { Link, useParams } from "react-router";
import { AugmentIcon } from "./components/AugmentIcon.tsx";
import { CategoryPopover } from "./components/CategoryToggle.tsx";
import { ChampionIcon } from "./components/ChampionTile.tsx";
import { bundle, iconUrl } from "./data/bundle.ts";
import type { Opener } from "./data/types.ts";
import type { CarryItem, CompRow } from "./domain/store.ts";
import { store, useStoreState } from "./domain/useStore.ts";

const championsById = new Map(bundle.champions.map((champion) => [champion.id, champion]));
const itemsById = new Map(bundle.items.map((item) => [item.id, item]));
const augmentsById = new Map(bundle.augments.map((augment) => [augment.id, augment]));

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{children}</h3>
);

const CarryItemView = ({ itemId, item, components }: CarryItem) => (
  <li className="flex items-center gap-2 text-sm">
    {item ? (
      <CategoryPopover kind="item" id={item.id}>
        <span className="flex items-center gap-2">
          <img src={iconUrl(item.icon)} alt="" className="size-8 rounded" />
          {item.name}
        </span>
      </CategoryPopover>
    ) : (
      <>
        <span className="size-8 rounded bg-white/10" />
        <span>{itemId}</span>
      </>
    )}
    {components.length > 0 && (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        {components.map(({ id, name, icon }) => (
          <img key={id} src={iconUrl(icon)} alt={name} title={name} className="size-5 rounded" />
        ))}
        {components.map(({ name }) => name).join(" + ")}
      </span>
    )}
  </li>
);

const CompRowView = ({ row }: { row: CompRow }) => {
  if (row.dead) {
    return (
      <li className="rounded border border-white/10 p-3 opacity-50">
        <p className="text-sm">{row.slug}</p>
        <p className="text-xs">No longer in the tier list</p>
      </li>
    );
  }
  const { comp, missingUnits, carry, keyAugments } = row;
  return (
    <li className="rounded border border-white/10 p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs font-semibold">Tier {comp.tier}</span>
        {comp.style !== "" && <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{comp.style}</span>}
        <span className="font-medium">{comp.title}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <SectionTitle>Units still needed</SectionTitle>
          {missingUnits.length === 0 ? (
            <p className="text-sm text-gray-400">None, the core covers the board.</p>
          ) : (
            <ul className="flex flex-wrap gap-1">
              {missingUnits.map((champion) => (
                <li key={champion.id}>
                  <ChampionIcon champion={champion} className="size-10" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <SectionTitle>{carry ? `${carry.champion.name} items` : "Carry items"}</SectionTitle>
          {carry && carry.items.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {carry.items.map((carryItem) => (
                <CarryItemView key={carryItem.itemId} {...carryItem} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No items listed.</p>
          )}
        </div>
        <div>
          <SectionTitle>Augment priority</SectionTitle>
          <p className="text-sm">{comp.augmentTypes.length > 0 ? comp.augmentTypes.join(", ") : "Not listed"}</p>
        </div>
        <div>
          <SectionTitle>Key augments</SectionTitle>
          {keyAugments.length === 0 ? (
            <p className="text-sm text-gray-400">None listed.</p>
          ) : (
            <ul className="flex flex-wrap gap-1">
              {keyAugments.map((augment) => (
                <li key={augment.id} title={augment.name}>
                  <CategoryPopover kind="augment" id={augment.id}>
                    <AugmentIcon augment={augment} />
                  </CategoryPopover>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
};

const OpenerGuidance = ({ opener }: { opener: Opener }) => (
  <section className="mb-6 rounded border border-white/10 p-3">
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <SectionTitle>Backline</SectionTitle>
        <p className="text-sm">{opener.backline}</p>
      </div>
      <div>
        <SectionTitle>Augment priority</SectionTitle>
        <p className="text-sm">{opener.augmentPriority.join(", ")}</p>
      </div>
      <div>
        <SectionTitle>Required items</SectionTitle>
        {opener.requiredItems.length === 0 ? (
          <p className="text-sm text-gray-400">None.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {opener.requiredItems.map(({ championId, itemIds }) => (
              <li key={championId}>
                {championsById.get(championId)?.name ?? championId}: {itemIds.map((id) => itemsById.get(id)?.name ?? id).join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <SectionTitle>Key augments</SectionTitle>
        {opener.keyAugmentIds.length === 0 ? (
          <p className="text-sm text-gray-400">None.</p>
        ) : (
          <ul className="flex flex-wrap gap-1">
            {opener.keyAugmentIds.map((id) => {
              const augment = augmentsById.get(id);
              return augment && (
                <li key={id} title={augment.name}>
                  <CategoryPopover kind="augment" id={id}>
                    <AugmentIcon augment={augment} />
                  </CategoryPopover>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
    {opener.notes.trim() !== "" && (
      <div className="mt-4">
        <SectionTitle>Notes</SectionTitle>
        <p className="whitespace-pre-wrap text-sm">{opener.notes}</p>
      </div>
    )}
  </section>
);

export const OpenerDetailPage = () => {
  const { openerId = "" } = useParams();
  // Re-render when the store changes.
  useStoreState();
  const detail = store.openerDetail(openerId);

  if (detail === null) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <p className="mb-2">This opener does not exist.</p>
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">
          Back to champions
        </Link>
      </div>
    );
  }

  const { opener, displayName, compRows } = detail;
  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold">{displayName}</h1>
        <div className="flex items-baseline gap-4 text-sm text-gray-400">
          <Link to={`/opener/${opener.id}/edit`} className="hover:text-gray-200">
            Edit
          </Link>
          <Link to="/" className="hover:text-gray-200">
            Back to champions
          </Link>
        </div>
      </header>
      <OpenerGuidance opener={opener} />
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Comps ({compRows.length})</h2>
      {compRows.length === 0 && <p className="text-sm text-gray-400">No comps linked. Link some in the editor.</p>}
      <ul className="flex flex-col gap-3">
        {compRows.map((row) => (
          <CompRowView key={row.dead ? row.slug : row.comp.slug} row={row} />
        ))}
      </ul>
    </div>
  );
};
