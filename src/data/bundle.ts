import type { DataBundle } from "./types.ts";
import bundleJson from "./bundle.json";

export const bundle: DataBundle = bundleJson as DataBundle;

const ICON_BASE_URL = "https://raw.communitydragon.org/latest/game/";

export const iconUrl = (iconPath: string) => `${ICON_BASE_URL}${iconPath}`;
