import { useState } from "react";
import { Link } from "react-router";
import { store } from "../domain/useStore.ts";
import type { Opener } from "../data/types.ts";

// Delete asks for a second click, so a stray click never loses an opener.
const DeleteButton = ({ openerId }: { openerId: string }) => {
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <button type="button" onClick={() => store.deleteOpener(openerId)} onBlur={() => setConfirming(false)} autoFocus className="text-red-400 hover:text-red-300">
      Confirm delete
    </button>
  ) : (
    <button type="button" onClick={() => setConfirming(true)} className="text-gray-400 hover:text-gray-200">
      Delete
    </button>
  );
};

export const OpenerActions = ({ openerId }: { openerId: string }) => (
  <span className="ml-auto flex items-center gap-3 text-xs">
    <Link to={`/opener/${openerId}/edit`} className="text-gray-400 hover:text-gray-200">
      Edit
    </Link>
    <DeleteButton openerId={openerId} />
  </span>
);

export const OpenerList = ({ openers }: { openers: readonly Opener[] }) => (
  <section>
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">All openers ({openers.length})</h2>
    {openers.length === 0 && <p className="text-sm text-gray-400">No openers yet.</p>}
    <ul className="flex flex-col gap-1">
      {openers.map((opener) => (
        <li key={opener.id} className="flex items-center gap-2 rounded border border-white/10 px-2 py-1 text-sm">
          <Link to={`/opener/${opener.id}`} className="truncate hover:underline">
            {store.displayName(opener)}
          </Link>
          <OpenerActions openerId={opener.id} />
        </li>
      ))}
    </ul>
  </section>
);
