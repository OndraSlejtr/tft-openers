import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { AugmentPicker } from "./components/AugmentPicker.tsx";
import { AugmentPriority } from "./components/AugmentPriority.tsx";
import { ChampionIcon } from "./components/ChampionTile.tsx";
import { CompPicker } from "./components/CompPicker.tsx";
import { ItemPalette } from "./components/ItemPalette.tsx";
import { bundle, iconUrl } from "./data/bundle.ts";
import type { Champion, Cost, RequiredItems } from "./data/types.ts";
import type { ChampionList } from "./domain/store.ts";
import { store, useStoreState } from "./domain/useStore.ts";

const COSTS: Cost[] = [1, 2, 3, 4, 5];
const BACKLINE_OPTIONS = ["AD", "AP", "flexible"] as const;

const championsById = new Map(bundle.champions.map((champion) => [champion.id, champion]));
const itemsById = new Map(bundle.items.map((item) => [item.id, item]));

// Dropping a champion on the pool removes it from the opener.
const POOL_ID = "pool";

const DraggableChampion = ({ champion, source }: { champion: Champion; source: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${source}:${champion.id}`,
    data: { championId: champion.id },
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={champion.name}
      className={`touch-none ${isDragging ? "opacity-40" : ""}`}
    >
      <ChampionIcon champion={champion} />
    </button>
  );
};

// A champion in the opener. Items can be dropped on it, and its own drag moves it between lists.
const OpenerChampion = ({
  champion,
  list,
  itemIds,
  onRemove,
  onRemoveItem,
}: {
  champion: Champion;
  list: ChampionList;
  itemIds: string[];
  onRemove: () => void;
  onRemoveItem: (itemId: string) => void;
}) => {
  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: `champion:${champion.id}`,
    data: { championId: champion.id },
    // Only items are dropped on champions, champions go to the lists.
    disabled: active?.data.current?.itemId === undefined,
  });
  return (
    <li ref={setNodeRef} className={`relative flex flex-col items-center gap-1 rounded p-1 ${isOver ? "bg-white/20" : ""}`}>
      <DraggableChampion champion={champion} source={list} />
      <button
        type="button"
        aria-label={`Remove ${champion.name}`}
        onClick={onRemove}
        className="absolute -right-1 -top-1 size-5 rounded-full bg-gray-800 text-xs leading-5 hover:bg-red-800"
      >
        ×
      </button>
      <ul className="flex gap-0.5">
        {itemIds.map((itemId) => {
          const item = itemsById.get(itemId);
          return (
            <li key={itemId}>
              <button type="button" title={`Remove ${item?.name ?? itemId}`} aria-label={`Remove ${item?.name ?? itemId}`} onClick={() => onRemoveItem(itemId)}>
                {item ? <img src={iconUrl(item.icon)} alt="" className="size-5 rounded" /> : <span className="text-xs">{itemId}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </li>
  );
};

type ChampionDropListProps = {
  list: ChampionList;
  title: string;
  championIds: string[];
  requiredItems: RequiredItems[];
  onRemove: (championId: string) => void;
  onRemoveItem: (championId: string, itemId: string) => void;
};

const ChampionDropList = ({ list, title, championIds, requiredItems, onRemove, onRemoveItem }: ChampionDropListProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: list });
  return (
    <section
      ref={setNodeRef}
      aria-label={title}
      className={`min-h-24 rounded border border-dashed p-2 ${isOver ? "border-white bg-white/10" : "border-white/20"}`}
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      {championIds.length === 0 && <p className="text-sm text-gray-400">Drag champions here.</p>}
      <ul className="flex flex-wrap gap-2">
        {championIds.map((championId) => {
          const champion = championsById.get(championId);
          return (
            champion && (
              <OpenerChampion
                key={championId}
                champion={champion}
                list={list}
                itemIds={requiredItems.find((entry) => entry.championId === championId)?.itemIds ?? []}
                onRemove={() => onRemove(championId)}
                onRemoveItem={(itemId) => onRemoveItem(championId, itemId)}
              />
            )
          );
        })}
      </ul>
    </section>
  );
};

const ChampionPool = () => {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });
  return (
    <div ref={setNodeRef} className={`flex flex-col gap-3 rounded p-2 ${isOver ? "bg-white/10" : ""}`}>
      {COSTS.map((cost, index) => (
        <section key={cost} className={index > 0 ? "border-t border-white/10 pt-3" : ""}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{cost} cost</h3>
          <ul className="flex flex-wrap gap-2">
            {bundle.champions
              .filter((champion) => champion.cost === cost)
              .map((champion) => (
                <li key={champion.id}>
                  <DraggableChampion champion={champion} source="pool" />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export const OpenerEditorPage = () => {
  const { openerId = "" } = useParams();
  const { openers } = useStoreState();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const [actionError, setActionError] = useState<string | null>(null);
  const opener = openers.find(({ id }) => id === openerId);

  if (opener === undefined) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <p className="mb-2">This opener does not exist.</p>
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">
          Back to champions
        </Link>
      </div>
    );
  }

  // Store errors, such as too many items on a champion, are shown instead of thrown.
  const attempt = (action: () => void) => {
    try {
      action();
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over === null) return;
    const { championId, itemId } = active.data.current ?? {};
    if (typeof itemId === "string") {
      const targetChampionId = over.data.current?.championId;
      if (typeof targetChampionId === "string") attempt(() => store.addRequiredItem(opener.id, targetChampionId, itemId));
    } else if (typeof championId === "string") {
      if (over.id === "core" || over.id === "target") attempt(() => store.placeChampion(opener.id, championId, over.id as ChampionList));
      else if (over.id === POOL_ID) attempt(() => store.placeChampion(opener.id, championId, null));
    }
  };

  const removeChampion = (championId: string) => attempt(() => store.placeChampion(opener.id, championId, null));
  const removeItem = (championId: string, itemId: string) => attempt(() => store.removeRequiredItem(opener.id, championId, itemId));

  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Edit opener</h1>
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">
          Back to champions
        </Link>
      </header>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-4">
            <ChampionPool />
            <ItemPalette />
          </div>
          <div className="flex flex-col gap-4">
            {actionError !== null && <p role="alert" className="rounded border border-red-500/50 bg-red-950/60 p-2 text-sm">{actionError}</p>}
            <label className="flex flex-col gap-1 text-sm">
              Name
              <input
                type="text"
                value={opener.name}
                onChange={(event) => store.updateOpener(opener.id, { name: event.target.value })}
                placeholder={store.displayName({ ...opener, name: "" })}
                className="rounded border border-white/10 bg-black/40 px-3 py-1.5"
              />
            </label>
            <ChampionDropList list="core" title="Core champions" championIds={opener.coreChampionIds} requiredItems={opener.requiredItems} onRemove={removeChampion} onRemoveItem={removeItem} />
            <ChampionDropList list="target" title="Target champions" championIds={opener.targetChampionIds} requiredItems={opener.requiredItems} onRemove={removeChampion} onRemoveItem={removeItem} />
            <div role="group" aria-label="Backline damage" className="flex flex-wrap items-center gap-2 text-sm">
              <span>Backline</span>
              {BACKLINE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={opener.backline === option}
                  onClick={() => store.updateOpener(opener.id, { backline: option })}
                  className={`rounded border px-3 py-1 ${opener.backline === option ? "border-white/60 bg-white/15" : "border-white/10 bg-black/40"}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <AugmentPriority priority={opener.augmentPriority} onChange={(priority) => attempt(() => store.setAugmentPriority(opener.id, priority))} />
            <AugmentPicker
              selectedAugmentIds={opener.keyAugmentIds}
              onAdd={(augmentId) => attempt(() => store.addKeyAugment(opener.id, augmentId))}
              onRemove={(augmentId) => attempt(() => store.removeKeyAugment(opener.id, augmentId))}
            />
            <CompPicker
              linkedCompSlugs={opener.compSlugs}
              onLink={(slug) => attempt(() => store.linkComp(opener.id, slug))}
              onUnlink={(slug) => attempt(() => store.unlinkComp(opener.id, slug))}
            />
            <label className="flex flex-col gap-1 text-sm">
              Notes
              <textarea
                value={opener.notes}
                onChange={(event) => store.updateOpener(opener.id, { notes: event.target.value })}
                rows={5}
                className="rounded border border-white/10 bg-black/40 px-3 py-1.5"
              />
            </label>
          </div>
        </div>
      </DndContext>
    </div>
  );
};
