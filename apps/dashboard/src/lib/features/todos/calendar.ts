import type { Todo } from "@template/core/todo";
import { group, type By } from "./group";
import { color, late } from "./status";

export type View =
  | "dayGridMonth"
  | "timeGridWeek"
  | "resourceTimeGridDay"
  | "resourceTimelineMonth"
  | "listMonth";

/** The views that read the `resources` axis, and so need a grouping to draw it. */
export const grouped = (view: View) => view.startsWith("resource");

const DAY = 86_400_000;

/** A local wall-clock day. The calendar hands back local Dates, and a UTC-midnight
 *  due date read as an instant would land a day early west of Greenwich. */
export const stamp = (at: Date) =>
  [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, "0"),
    String(at.getDate()).padStart(2, "0"),
  ].join("-");

const day = (iso: string) => iso.slice(0, 10);

/** Day arithmetic on the bare date, so no zone can shift the result. */
const shift = (iso: string, days: number) =>
  new Date(Date.parse(day(iso)) + days * DAY).toISOString().slice(0, 10);

/** The lane a todo belongs to — the same keys `group` buckets by. */
const lane = (todo: Todo.Info, by: By) => {
  if (by === "status") return todo.status;
  if (by === "stage") return todo.stage ?? "none";
  return todo.assignee?.id ?? "none";
};

/** Group rows for the resource views. Colors ride along as the lane's event default. */
export const resources = (todos: Todo.Info[], by: By) =>
  group(todos, by).map((row) => ({
    id: row.key,
    title: row.label,
    eventBackgroundColor: row.color,
  }));

/**
 * Todos as all-day events. `end` is exclusive, so a span reaches past its due day, and a
 * todo with neither date never lands on a calendar.
 */
export const events = (todos: Todo.Info[], by: By) =>
  todos.flatMap((todo) => {
    const from = todo.startDate ?? todo.dueDate;
    const to = todo.dueDate ?? todo.startDate;
    if (!from || !to) return [];
    return [
      {
        id: todo.id,
        title: todo.title,
        start: day(from),
        end: shift(to, 1),
        allDay: true,
        resourceId: lane(todo, by),
        backgroundColor: color(todo.status),
        classNames: late(todo) ? ["late"] : [],
      },
    ];
  });

/** The inverse: a dropped or resized event's exclusive end is the day after the due day. */
export function span(event: { start: Date; end: Date }) {
  const due = new Date(event.end);
  // setDate, not minus 24h — an hour of DST would round the wrong way.
  due.setDate(due.getDate() - 1);
  return { startDate: stamp(event.start), dueDate: stamp(due) };
}

/** What a drag writes: the new span, plus the lane field when it crossed a row. */
export type Move = {
  id: string;
  startDate: string;
  dueDate: string;
  status?: Todo.Status;
  stage?: string | null;
  assignee?: string | null;
};
