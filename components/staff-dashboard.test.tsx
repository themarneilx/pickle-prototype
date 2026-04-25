import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StaffDashboard } from "./staff-dashboard";

describe("StaffDashboard", () => {
  it("renders the full admin navigation", () => {
    const html = renderToStaticMarkup(<StaffDashboard />);

    for (const label of [
      "Bookings",
      "Schedule",
      "Courts",
      "Privacy Statements",
      "Gallery",
      "Reports",
      "About",
      "Billing",
    ]) {
      expect(html).toContain(label);
    }
  });

  it("renders mobile primary admin tabs", () => {
    const html = renderToStaticMarkup(<StaffDashboard />);

    expect(html).toMatch(/Bookings<\/button>/);
    expect(html).toMatch(/Schedule<\/button>/);
    expect(html).toMatch(/Courts<\/button>/);
    expect(html).toMatch(/Reports<\/button>/);
    expect(html).toMatch(/More<\/button>/);
  });

  it("renders report time analysis when reports are active", () => {
    const html = renderToStaticMarkup(<StaffDashboard initialSection="reports" />);

    expect(html).toContain("Time Analysis");
    expect(html).toContain("Peak window");
    expect(html).toContain("Slow window");
  });

  it("renders direct manual pricing fields in the courts section", () => {
    const html = renderToStaticMarkup(<StaffDashboard initialSection="courts" />);

    expect(html).toContain("Hourly price");
    expect(html).toContain("Rule price");
    expect(html).toContain('inputMode="numeric"');
  });
});
