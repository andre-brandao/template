import { toast } from "@template/ui";

// A menu item closes on select, so a toast is the only place the result can show.
export const copy = (text: string) =>
  navigator.clipboard.writeText(text).then(
    () => toast.success("Copied"),
    () => toast.error("Could not copy"),
  );
