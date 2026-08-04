/// <reference lib="dom" />

import { describe, expect, test } from "bun:test";
import { render, fireEvent } from "@testing-library/svelte";

import Select from "./Select.svelte";

const options = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// Queries are scoped to each render's own container — the suite shares one document,
// so a global `screen` lookup would also see the other tests' selects.
describe("Select", () => {
  test("renders one option per entry", () => {
    const { container } = render(Select, { options });
    const rendered = [...container.querySelectorAll("option")];
    expect(rendered.map((option) => option.value)).toEqual(["system", "light", "dark"]);
    expect(rendered.map((option) => option.textContent)).toEqual(["System", "Light", "Dark"]);
  });

  test("appends the hint to the label", () => {
    const { container } = render(Select, {
      options: [{ value: "", label: "System", hint: "America/Sao_Paulo" }],
    });
    expect(container.querySelector("option")?.textContent).toBe("System — America/Sao_Paulo");
  });

  test("shows the selected value and reports changes", async () => {
    let picked = "";
    const { container } = render(Select, {
      options,
      value: "dark",
      onchange: (e: Event) => (picked = (e.currentTarget as HTMLSelectElement).value),
    });

    const select = container.querySelector("select")!;
    expect(select.value).toBe("dark");

    await fireEvent.change(select, { target: { value: "light" } });
    expect(picked).toBe("light");
  });

  test("passes attributes through to the element", () => {
    const { container } = render(Select, { options, name: "theme", disabled: true });
    const select = container.querySelector("select")!;
    expect(select.name).toBe("theme");
    expect(select.disabled).toBe(true);
  });
});
