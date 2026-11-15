import type { Tone } from "@template/ui";
import type { Feedback } from "@template/core/feedback";

type Label = { label: string; tone: Tone };

export const tags: Record<Feedback.Row["tag"], Label> = {
  bug: { label: "Bug", tone: "danger" },
  feature: { label: "Feature", tone: "accent" },
  support: { label: "Support", tone: "progress" },
};

export const urgencies: Record<Feedback.Row["urgency"], Label> = {
  low: { label: "Low", tone: "done" },
  medium: { label: "Medium", tone: "progress" },
  high: { label: "High", tone: "danger" },
};

export const states: Record<Feedback.Row["state"], Label> = {
  open: { label: "Open", tone: "progress" },
  closed: { label: "Resolved", tone: "done" },
};
