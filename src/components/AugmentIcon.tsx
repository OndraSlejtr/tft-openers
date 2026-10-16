import { iconUrl } from "../data/bundle.ts";
import type { Augment } from "../data/types.ts";

type AugmentIconProps = {
  augment: Augment;
};

// Many augments only have a placeholder icon upstream, so the name is shown instead.
export const AugmentIcon = ({ augment: { icon, name } }: AugmentIconProps) =>
  icon === null ? (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded bg-white/10 p-0.5 text-center text-[9px] leading-tight">
      {name}
    </span>
  ) : (
    <img src={iconUrl(icon)} alt={name} loading="lazy" className="size-10 shrink-0 rounded" />
  );
