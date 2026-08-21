import { describe, expect, it } from "bun:test";
import {
  bold,
  button,
  code,
  esc,
  head,
  join,
  link,
  list,
  type Node,
  preview,
  render,
  rule,
  small,
  table,
  text,
  theme,
} from "../src/lib/email/render";

/** What a fork writes when it wants a component the DSL doesn't ship. */
function badge(label: string): Node {
  return {
    html: `<span style="background:${theme.line}">${esc(label)}</span>`,
    text: `[${label}]`,
  };
}

describe("render", () => {
  it("returns the two fields a message carries", () => {
    const mail = render([head("Hi"), text("Welcome.")]);

    expect(mail.body).toBe("Hi\n\nWelcome.");
    expect(mail.html).toStartWith("<!doctype html>");
    expect(mail.html).toContain("max-width:600px");
    expect(mail.html).toEndWith("</html>");
  });

  it("escapes a string child on the html side and leaves the text alone", () => {
    const mail = render([text("<script>alert('x')</script> & \"quotes\"")]);

    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("&amp;");
    expect(mail.html).toContain("&quot;quotes&quot;");
    expect(mail.body).toBe("<script>alert('x')</script> & \"quotes\"");
  });

  it("escapes an href, so a url can't break out of the attribute", () => {
    expect(link("go", `https://x.test/?a=1"onclick="evil()`).html).toContain(
      "?a=1&quot;onclick=&quot;evil()",
    );
  });

  it("keeps a preheader out of the text body", () => {
    const mail = render([preview("hidden"), head("Visible")]);

    expect(mail.html).toContain("hidden");
    expect(mail.body).toBe("Visible");
  });
});

describe("components", () => {
  it("nests inline nodes inside a block", () => {
    const node = text("Questions? ", link("reply", "mailto:a@b.test"), " or ", bold("call"), ".");

    expect(node.html).toContain('<a href="mailto:a@b.test"');
    expect(node.html).toContain("<strong>call</strong>");
    expect(node.text).toBe("Questions? reply (mailto:a@b.test) or call.");
  });

  it("drops the label when a link is its own url", () => {
    expect(link("https://x.test", "https://x.test").text).toBe("https://x.test");
  });

  it("renders a button as a table so outlook paints it", () => {
    const node = button("Open dashboard", "https://x.test/app");

    expect(node.html).toContain(`bgcolor="${theme.accent}"`);
    expect(node.text).toBe("Open dashboard: https://x.test/app");
  });

  it("renders a code block verbatim in text, so a reader can copy it", () => {
    expect(code("482913").text).toBe("482913");
  });

  it("bullets a list", () => {
    const node = list(["one", link("two", "https://x.test")]);

    expect(node.html).toContain("<li>one</li>");
    expect(node.text).toBe("- one\n- two (https://x.test)");
  });

  it("aligns table columns in text and heads them in html", () => {
    const node = table(
      ["Plan", "Seats"],
      [
        ["Pro", "12"],
        ["Enterprise", "400"],
      ],
    );

    expect(node.html.match(/<th /g)).toHaveLength(2);
    expect(node.html.match(/<tr>/g)).toHaveLength(3);
    expect(node.text).toBe(["Plan        Seats", "Pro         12", "Enterprise  400"].join("\n"));
  });

  it("draws a rule on both sides", () => {
    expect(rule().text).toBe("---");
    expect(rule().html).toContain(theme.line);
  });

  it("mutes small print", () => {
    expect(small("– The Team").html).toContain(theme.mute);
  });
});

describe("extension", () => {
  it("composes a hand-written component like any other", () => {
    const mail = render([text("Status: ", badge("active")), badge("beta")]);

    expect(mail.html).toContain(`<span style="background:${theme.line}">active</span>`);
    expect(mail.body).toBe("Status: [active]\n\n[beta]");
  });

  it("escapes what a custom component folds through join", () => {
    expect(join(["a & b", badge("<b>")]).html).toBe(
      'a &amp; b<span style="background:#e5e7eb">&lt;b&gt;</span>',
    );
  });
});
