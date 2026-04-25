import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteNav } from "./site-nav";

describe("SiteNav", () => {
  it("keeps staff navigation accessible on mobile", () => {
    const html = renderToStaticMarkup(<SiteNav />);

    expect(html).toContain('href="/staff"');
    expect(html).toMatch(/class="[^"]*md:hidden[^"]*" href="\/staff"/);
  });
});
