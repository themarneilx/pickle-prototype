import { describe, expect, it } from "vitest";

import { buildInitialBookingState } from "./booking-data";
import { setCourtHourlyRate, setPricingRulePrice } from "./admin-mutations";

describe("admin pricing mutations", () => {
  it("sets a court hourly rate to the typed price", () => {
    const state = buildInitialBookingState();

    const updated = setCourtHourlyRate(state, "court-agave", 725);

    expect(updated.courts.find((court) => court.id === "court-agave")?.hourlyRate).toBe(725);
    expect(state.courts.find((court) => court.id === "court-agave")?.hourlyRate).toBe(300);
  });

  it("sets a pricing rule to the typed price", () => {
    const state = buildInitialBookingState();

    const updated = setPricingRulePrice(state, "pricing-weekday-evening", 900);

    expect(updated.pricingRules.find((rule) => rule.id === "pricing-weekday-evening")?.price).toBe(900);
    expect(state.pricingRules.find((rule) => rule.id === "pricing-weekday-evening")?.price).toBe(700);
  });

  it("keeps manually typed prices at zero or above", () => {
    const state = buildInitialBookingState();

    const updated = setCourtHourlyRate(state, "court-agave", -50);

    expect(updated.courts.find((court) => court.id === "court-agave")?.hourlyRate).toBe(0);
  });

  it("normalizes invalid manually typed prices to zero", () => {
    const state = buildInitialBookingState();

    const updated = setPricingRulePrice(state, "pricing-weekday-evening", Number.NaN);

    expect(updated.pricingRules.find((rule) => rule.id === "pricing-weekday-evening")?.price).toBe(0);
  });
});
