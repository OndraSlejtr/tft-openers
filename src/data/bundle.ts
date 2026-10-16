import type { DataBundle } from "./types.ts";
import bundleJson from "./bundle.json";

export const bundle: DataBundle = bundleJson as DataBundle;

const ICON_BASE_URL = "https://raw.communitydragon.org/latest/game/";

// Shown for champions that have no usable icon upstream.
export const PLACEHOLDER_ICON = "assets/maps/particles/tft/item_icons/placeholders/tft_item_unknown.png";

export const iconUrl = (iconPath: string) => `${ICON_BASE_URL}${iconPath}`;
