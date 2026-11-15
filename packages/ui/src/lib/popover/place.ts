export type Place = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";

const gap = 6;
const flip = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;

/**
 * Pins a fixed, top-layer `panel` beside `at`: flips to the opposite side when there is no
 * room, then clamps into the viewport. Returns the side it landed on.
 */
export function place(panel: HTMLElement, at: DOMRect, side: Place, align: Align) {
  const own = panel.getBoundingClientRect();
  const vertical = side === "top" || side === "bottom";
  const along = vertical
    ? { start: at.left, center: at.left + at.width / 2 - own.width / 2, end: at.right - own.width }[
        align
      ]
    : {
        start: at.top,
        center: at.top + at.height / 2 - own.height / 2,
        end: at.bottom - own.height,
      }[align];
  const edge = {
    top: at.top - gap - own.height,
    bottom: at.bottom + gap,
    left: at.left - gap - own.width,
    right: at.right + gap,
  };
  const fits = {
    top: edge.top >= 0,
    bottom: edge.bottom + own.height <= innerHeight,
    left: edge.left >= 0,
    right: edge.right + own.width <= innerWidth,
  };
  const to = fits[side] || !fits[flip[side]] ? side : flip[side];
  const pos = vertical ? { left: along, top: edge[to] } : { left: edge[to], top: along };
  panel.style.left = `${Math.max(gap, Math.min(pos.left, innerWidth - own.width - gap))}px`;
  panel.style.top = `${Math.max(gap, Math.min(pos.top, innerHeight - own.height - gap))}px`;
  return to;
}
