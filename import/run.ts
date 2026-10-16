import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { transform } from "./transform.ts";

const CDRAGON_URL = "https://raw.communitydragon.org/latest/cdragon/tft/en_us.json";
const ACADEMY_URL = "https://tftacademy.com/tierlist/comps/__data.json";
const USER_AGENT = "tft-openers-import (personal project, runs once per patch)";
const OUTPUT_PATH = new URL("../src/data/bundle.json", import.meta.url);

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Fetching ${url} failed with status ${response.status}`);
  return response.json();
};

const main = async () => {
  const [cdragon, academy] = await Promise.all([fetchJson(CDRAGON_URL), fetchJson(ACADEMY_URL)]);
  // The transform throws on unexpected data, so nothing is written for a partial result.
  const bundle = transform({ cdragon, academy });
  await mkdir(dirname(OUTPUT_PATH.pathname), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(bundle, null, 2)}\n`);
  console.log(`Wrote ${bundle.champions.length} champions for set ${bundle.setNumber}, patch ${bundle.patch}`);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
