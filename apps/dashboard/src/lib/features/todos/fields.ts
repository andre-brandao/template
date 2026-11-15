import { fromDay } from "@template/ui";

/** A form field as core takes it: blank is undefined. */
export const text = (data: FormData, key: string) =>
  String(data.get(key) ?? "").trim() || undefined;

/** A bare day starts in the user's zone, never UTC midnight; an instant passes through. */
export const day = (data: FormData, key: string, zone: string) => {
  const value = text(data, key);
  if (!value) return;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? fromDay(value, zone) : new Date(value).toISOString();
};
