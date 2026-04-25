import { describe, expect, it } from "vitest";

import { buildInitialBookingState } from "./booking-data";
import {
  getAdminSummary,
  getCourtUtilizationRanking,
  getHourlyDemandAnalysis,
  getRevenueSeries,
} from "./admin-analytics";

describe("admin analytics", () => {
  it("summarizes confirmed booking revenue for a date range", () => {
    const state = buildInitialBookingState();

    expect(getAdminSummary(state, "2026-04-24", "2026-04-24")).toMatchObject({
      confirmedBookings: 11,
      totalRevenue: 4800,
      averageRevenuePerBooking: 436,
    });
  });

  it("detects peak and slow booking hours", () => {
    const state = buildInitialBookingState();

    expect(getHourlyDemandAnalysis(state, "2026-04-24", "2026-04-30")).toMatchObject({
      peakHour: 9,
      peakBookings: 3,
      slowHour: 6,
      slowBookings: 0,
      recommendation: expect.stringContaining("6:00 AM"),
    });
  });

  it("ranks courts by utilization", () => {
    const state = buildInitialBookingState();

    expect(getCourtUtilizationRanking(state, "2026-04-24", "2026-04-24")[0]).toMatchObject({
      courtId: "court-agave",
      bookedSlots: 3,
      utilization: 19,
    });
  });

  it("creates a daily revenue series", () => {
    const state = buildInitialBookingState();

    expect(getRevenueSeries(state, "2026-04-24", "2026-04-26")).toEqual([
      { date: "2026-04-24", revenue: 4800, bookings: 11 },
      { date: "2026-04-25", revenue: 720, bookings: 2 },
      { date: "2026-04-26", revenue: 510, bookings: 1 },
    ]);
  });
});
