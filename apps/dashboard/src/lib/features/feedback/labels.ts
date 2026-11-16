import Bug from "@lucide/svelte/icons/bug";
import CircleCheck from "@lucide/svelte/icons/circle-check";
import CircleDot from "@lucide/svelte/icons/circle-dot";
import LifeBuoy from "@lucide/svelte/icons/life-buoy";
import SignalHigh from "@lucide/svelte/icons/signal-high";
import SignalLow from "@lucide/svelte/icons/signal-low";
import SignalMedium from "@lucide/svelte/icons/signal-medium";
import Sparkles from "@lucide/svelte/icons/sparkles";
import type { Tone } from "@template/ui";
import type { Feedback } from "@template/core/feedback";

// The one place a label gets its colour: every chip, badge and row reads `tone` from here.
export type Label = { label: string; tone: Tone; icon: typeof Bug; hint?: string };

export const tags: Record<Feedback.Row["tag"], Label> = {
  bug: { label: "Bug", tone: "danger", icon: Bug, hint: "Something is broken or wrong" },
  feature: {
    label: "Feature",
    tone: "info",
    icon: Sparkles,
    hint: "An idea, or something missing",
  },
  support: { label: "Support", tone: "accent", icon: LifeBuoy },
};

export const urgencies: Record<Feedback.Row["urgency"], Label> = {
  low: { label: "Low", tone: "done", icon: SignalLow, hint: "A nuisance; I can keep working" },
  medium: { label: "Medium", tone: "progress", icon: SignalMedium, hint: "It slows me down" },
  high: { label: "High", tone: "danger", icon: SignalHigh, hint: "I'm blocked" },
};

export const states: Record<Feedback.Row["state"], Label> = {
  open: { label: "Open", tone: "progress", icon: CircleDot },
  closed: { label: "Resolved", tone: "done", icon: CircleCheck },
};
