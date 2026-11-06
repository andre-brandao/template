/** An `enhance` callback for inline add forms: submit, clear the inputs, then refresh. */
export function resets(after: () => Promise<unknown>) {
  return async (f: { submit: () => Promise<unknown>; element: HTMLFormElement }) => {
    await f.submit();
    f.element.reset();
    await after();
  };
}
