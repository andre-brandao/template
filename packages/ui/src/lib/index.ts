// input, date, markdown and pane group a family; everything else is one folder per component,
// holding its story, tests and css.

// input
export { default as Button } from "./input/Button.svelte";
export { default as IconButton } from "./input/IconButton.svelte";
export { default as Input } from "./input/Input.svelte";
export { default as LazySelect } from "./input/LazySelect.svelte";
export { default as Select, type Option } from "./input/Select.svelte";
export { default as Textarea } from "./input/Textarea.svelte";

// date
export { default as Calendar, type Mode } from "./date/Calendar.svelte";
export { default as DatePicker } from "./date/DatePicker.svelte";
export { default as DateSpanPicker, type Span } from "./date/DateSpanPicker.svelte";
export { default as MonthGrid, type Cell, type Look } from "./date/MonthGrid.svelte";
export { default as RangePicker, type Footer } from "./date/RangePicker.svelte";
export { dates, setDates, type Dates } from "./date/ctx";
export {
  at,
  format,
  fromDay,
  last,
  shift,
  split,
  toDay,
  today,
  valid,
  week,
  weekdays,
  weekStart,
  type Day,
  type Range,
  type Weekday,
} from "./date/day";

// markdown
export { default as Markdown } from "./markdown/Markdown.svelte";
export { default as MarkdownEditor } from "./markdown/MarkdownEditor.svelte";
export type { Components } from "./markdown/render/types";
export { default as Mermaid } from "./markdown/Mermaid.svelte";

export { default as Avatar } from "./avatar/Avatar.svelte";
export { default as Badge, type Tone } from "./badge/Badge.svelte";
export { default as Card } from "./card/Card.svelte";
export { default as Code } from "./code/Code.svelte";
export { default as Command, type Action } from "./command/Command.svelte";
export { default as Combobox, type Row } from "./combobox/Combobox.svelte";
export { default as DataTable } from "./table/DataTable.svelte";
export { features, type Features } from "./table/table";
export { default as Drawer, type Side } from "./drawer/Drawer.svelte";
export { default as Empty } from "./empty/Empty.svelte";
export { default as Field } from "./field/Field.svelte";
export { default as Fill } from "./pane/Fill.svelte";
export { default as FormBoundary } from "./boundary/FormBoundary.svelte";
export { default as Full } from "./full/Full.svelte";
export { default as Inline } from "./inline/Inline.svelte";
export { default as Issue } from "./issue/Issue.svelte";
export { default as Kbd } from "./kbd/Kbd.svelte";
// Root, Row and Loading: `<List.Root>` holds dense `<List.Row>`s; `<List.Loading>` stands in for them.
export * as List from "./list";
// Root, Item, Label and Separator: `<Menu.Root>`.
export * as Menu from "./menu";
export { default as Meter } from "./meter/Meter.svelte";
export { default as Dialog } from "./modal/Dialog.svelte";
export { default as Modals } from "./modal/Modals.svelte";
export { modal, type Ask } from "./modal/modal.svelte";
export { default as Pagination } from "./pagination/Pagination.svelte";
export { default as Popover, type Trigger } from "./popover/Popover.svelte";
export type { Align, Place } from "./popover/place";
export { default as Scroll } from "./pane/Scroll.svelte";
export { default as Section } from "./section/Section.svelte";
export { default as Skeleton } from "./skeleton/Skeleton.svelte";
export { default as Spinner } from "./spinner/Spinner.svelte";
export { default as Stat } from "./stat/Stat.svelte";
export { default as Status, type State } from "./status/Status.svelte";
// A container and its items, so it lands as a namespace like List.
export * as Tabs from "./tabs";
export { default as Toaster } from "./toast/Toaster.svelte";
export { default as Toggle } from "./toggle/Toggle.svelte";
export { toast, type Kind, type Opts } from "./toast/toast.svelte";
export { default as Tooltip } from "./tooltip/Tooltip.svelte";
