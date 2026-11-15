/** The one failure message `Announcer` reads out. Module state: only effects write it. */
export const voice = $state({ text: "" });

/**
 * Cleared first and refilled a beat later, so a repeated message is read again and the
 * region is back on top before the text lands.
 */
export function announce(text: string) {
  voice.text = "";
  setTimeout(() => (voice.text = text), 100);
}
