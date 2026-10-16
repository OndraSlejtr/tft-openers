import { ChampionGrid } from "./components/ChampionGrid.tsx";
import { bundle } from "./data/bundle.ts";

export const MainScreen = () => (
  <div className="mx-auto max-w-5xl p-4">
    <header className="mb-4 flex items-baseline justify-between">
      <h1 className="text-xl font-semibold">TFT openers</h1>
      <span className="text-sm text-gray-400">
        Set {bundle.setNumber}, patch {bundle.patch}
      </span>
    </header>
    <ChampionGrid champions={bundle.champions} />
  </div>
);
