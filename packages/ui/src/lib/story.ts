import type { Component } from "svelte";

import * as button from "./input/Button.story.svelte";
import * as iconbutton from "./input/IconButton.story.svelte";
import * as input from "./input/Input.story.svelte";
import * as lazyselect from "./input/LazySelect.story.svelte";
import * as calendar from "./date/Calendar.story.svelte";
import * as datepicker from "./date/DatePicker.story.svelte";
import * as datespanpicker from "./date/DateSpanPicker.story.svelte";
import * as monthgrid from "./date/MonthGrid.story.svelte";
import * as rangepicker from "./date/RangePicker.story.svelte";
import * as select from "./input/Select.story.svelte";
import * as textarea from "./input/Textarea.story.svelte";
import * as markdown from "./markdown/Markdown.story.svelte";
import * as mermaid from "./markdown/Mermaid.story.svelte";
import * as ascii from "./markdown/MermaidAscii.story.svelte";
import * as editor from "./markdown/MarkdownEditor.story.svelte";
import * as avatar from "./avatar/Avatar.story.svelte";
import * as badge from "./badge/Badge.story.svelte";
import * as card from "./card/Card.story.svelte";
import * as code from "./code/Code.story.svelte";
import * as command from "./command/Command.story.svelte";
import * as combobox from "./combobox/Combobox.story.svelte";
import * as dialog from "./modal/Dialog.story.svelte";
import * as drawer from "./drawer/Drawer.story.svelte";
import * as empty from "./empty/Empty.story.svelte";
import * as field from "./field/Field.story.svelte";
import * as boundary from "./boundary/FormBoundary.story.svelte";
import * as inline from "./inline/Inline.story.svelte";
import * as issue from "./issue/Issue.story.svelte";
import * as kbd from "./kbd/Kbd.story.svelte";
import * as list from "./list/List.story.svelte";
import * as menu from "./menu/Menu.story.svelte";
import * as modal from "./modal/Modals.story.svelte";
import * as pagination from "./pagination/Pagination.story.svelte";
import * as popover from "./popover/Popover.story.svelte";
import * as scroll from "./pane/Scroll.story.svelte";
import * as skeleton from "./skeleton/Skeleton.story.svelte";
import * as spinner from "./spinner/Spinner.story.svelte";
import * as meter from "./meter/Meter.story.svelte";
import * as stat from "./stat/Stat.story.svelte";
import * as status from "./status/Status.story.svelte";
import * as tabs from "./tabs/Tabs.story.svelte";
import * as toggle from "./toggle/Toggle.story.svelte";
import * as toaster from "./toast/Toaster.story.svelte";
import * as tooltip from "./tooltip/Tooltip.story.svelte";

export type Control =
  | { type: "text"; value: string }
  | { type: "textarea"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "number"; value: number }
  | { type: "select"; value: string; options: string[] };

export type Story = {
  title: string;
  blurb?: string;
  of: Component<any>;
  /** Props every instance needs but nobody edits — required data, callbacks. */
  base?: Record<string, unknown>;
  /** Editable props, seeded with the values the live instance starts at. */
  props?: Record<string, Control>;
  /** Text handed to components whose `children` snippet is required. */
  slot?: string;
  /** For components that read a prop once at init — the live instance remounts on edit. */
  remount?: boolean;
  variants?: { label: string; props: Record<string, unknown> }[];
};

/** Story sources, keyed by lowercased basename — which is also the slug. */
const src = Object.fromEntries(
  Object.entries(
    import.meta.glob("./**/*.story.svelte", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>,
  ).map(([path, text]) => [
    path.split("/").pop()!.replace(".story.svelte", "").toLowerCase(),
    text,
  ]),
);

/**
 * Written out by hand: the set of documented components is worth seeing in one place,
 * and a story that forgets its `story` export fails the build instead of vanishing.
 * `demo` is the story file's own markup — empty for the ones the object fully describes.
 */
export const stories = [
  { slug: "button", story: button.story, demo: button.default },
  { slug: "iconbutton", story: iconbutton.story, demo: iconbutton.default },
  { slug: "input", story: input.story, demo: input.default },
  { slug: "lazyselect", story: lazyselect.story, demo: lazyselect.default },
  { slug: "calendar", story: calendar.story, demo: calendar.default },
  { slug: "datepicker", story: datepicker.story, demo: datepicker.default },
  { slug: "datespanpicker", story: datespanpicker.story, demo: datespanpicker.default },
  { slug: "monthgrid", story: monthgrid.story, demo: monthgrid.default },
  { slug: "rangepicker", story: rangepicker.story, demo: rangepicker.default },
  { slug: "select", story: select.story, demo: select.default },
  { slug: "textarea", story: textarea.story, demo: textarea.default },
  { slug: "markdown", story: markdown.story, demo: markdown.default },
  { slug: "markdowneditor", story: editor.story, demo: editor.default },
  { slug: "mermaid", story: mermaid.story, demo: mermaid.default },
  { slug: "mermaidascii", story: ascii.story, demo: ascii.default },
  { slug: "avatar", story: avatar.story, demo: avatar.default },
  { slug: "badge", story: badge.story, demo: badge.default },
  { slug: "card", story: card.story, demo: card.default },
  { slug: "code", story: code.story, demo: code.default },
  { slug: "command", story: command.story, demo: command.default },
  { slug: "combobox", story: combobox.story, demo: combobox.default },
  { slug: "dialog", story: dialog.story, demo: dialog.default },
  { slug: "drawer", story: drawer.story, demo: drawer.default },
  { slug: "empty", story: empty.story, demo: empty.default },
  { slug: "field", story: field.story, demo: field.default },
  { slug: "formboundary", story: boundary.story, demo: boundary.default },
  { slug: "inline", story: inline.story, demo: inline.default },
  { slug: "issue", story: issue.story, demo: issue.default },
  { slug: "kbd", story: kbd.story, demo: kbd.default },
  { slug: "list", story: list.story, demo: list.default },
  { slug: "menu", story: menu.story, demo: menu.default },
  { slug: "modals", story: modal.story, demo: modal.default },
  { slug: "pagination", story: pagination.story, demo: pagination.default },
  { slug: "popover", story: popover.story, demo: popover.default },
  { slug: "scroll", story: scroll.story, demo: scroll.default },
  { slug: "skeleton", story: skeleton.story, demo: skeleton.default },
  { slug: "spinner", story: spinner.story, demo: spinner.default },
  { slug: "meter", story: meter.story, demo: meter.default },
  { slug: "stat", story: stat.story, demo: stat.default },
  { slug: "status", story: status.story, demo: status.default },
  { slug: "tabs", story: tabs.story, demo: tabs.default },
  { slug: "toaster", story: toaster.story, demo: toaster.default },
  { slug: "toggle", story: toggle.story, demo: toggle.default },
  { slug: "tooltip", story: tooltip.story, demo: tooltip.default },
]
  .map((one) => ({ ...one, src: src[one.slug] ?? "" }))
  .sort((a, b) => a.story.title.localeCompare(b.story.title));

export type Entry = (typeof stories)[number];
