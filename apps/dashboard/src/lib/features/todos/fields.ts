/** A form field as core takes it: blank is undefined. */
export const text = (data: FormData, key: string) =>
  String(data.get(key) ?? "").trim() || undefined;

/** `<input type="date">` gives a bare day; core wants a full instant. */
export const day = (data: FormData, key: string) => {
  const value = text(data, key);
  return value && new Date(value).toISOString();
};
