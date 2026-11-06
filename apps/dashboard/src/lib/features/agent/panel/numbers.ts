/** Rows as a block reads them: typed columns, then plain records. */
type Rows = { columns: { name: string; type: string }[]; rows: Record<string, unknown>[] };

type Column = Rows["columns"][number];

/** Whether a column holds numbers, by its Postgres type. */
export const numeric = (col: { type: string }) =>
  ["bigint", "smallint", "integer", "real", "double", "numeric"].includes(col.type);

export function formatter(format: "number" | "percent" | null | undefined) {
  const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  return (value: number) => (format === "percent" ? `${num.format(value)}%` : num.format(value));
}

// The column the model named, else the first one passing `test`.
function pick(data: Rows, name: string | null | undefined, test: (col: Column) => boolean) {
  return (data.columns.find((col) => col.name === name) ?? data.columns.find(test))?.name;
}

// Postgres hands numeric and bigint back as strings; anything else non-finite is no number.
function finite(raw: unknown) {
  const number = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  return typeof number === "number" && Number.isFinite(number) ? number : undefined;
}

/** A Metric's number: `column` of the first row, or its first numeric column. */
export function metric(data: Rows, column?: string | null) {
  const name = pick(data, column, numeric);
  return name ? finite(data.rows[0]?.[name]) : undefined;
}

/** A Chart's bars: one per row (at most 50), each as wide as its share of the largest. */
export function bars(data: Rows, x?: string | null, y?: string | null) {
  const value = pick(data, y, numeric);
  if (!value) return undefined;
  const label = pick(data, x, (col) => col.name !== value);
  const rows = data.rows.slice(0, 50).map((row) => ({
    label: label ? String(row[label] ?? "—") : "",
    value: Number(row[value]) || 0,
  }));
  const top = Math.max(...rows.map((row) => Math.abs(row.value)), 1);
  return rows.map((row) => ({ ...row, width: (Math.abs(row.value) / top) * 100 }));
}
