import { describe, expect, it } from "vitest";

import { addOns, buildInitialBookingState } from "./booking-data";
import {
  createReservation,
  getAvailabilityForDate,
  getSlotStatus,
  updateReservationStatus,
} from "./booking-logic";

describe("booking logic", () => {
  it("reports seeded bookings and open slots for a date", () => {
    const state = buildInitialBookingState();

    expect(
      getSlotStatus(state, {
        courtId: "court-agave",
        date: "2026-04-24",
        startHour: 8,
      }),
    ).toBe("booked");

    expect(
      getSlotStatus(state, {
        courtId: "court-agave",
        date: "2026-04-24",
        startHour: 6,
      }),
    ).toBe("open");

    expect(getAvailabilityForDate(state, "2026-04-24")).toMatchObject({
      totalSlots: 64,
      bookedSlots: 11,
      openSlots: 53,
      status: "available",
    });
  });

  it("creates a reservation, prices add-ons, and blocks the selected slot", () => {
    const state = buildInitialBookingState();
    const result = createReservation(state, {
      id: "reservation-test",
      courtId: "court-agave",
      customer: {
        name: "Mara Santos",
        phone: "0917 555 1000",
        email: "mara@example.com",
        skillLevel: "intermediate",
      },
      date: "2026-04-24",
      startHour: 6,
      durationHours: 1,
      addOnIds: ["paddle-rental", "ball-tube"],
    });

    const addOnTotal = addOns
      .filter((addOn) => ["paddle-rental", "ball-tube"].includes(addOn.id))
      .reduce((sum, addOn) => sum + addOn.price, 0);

    expect(result.reservation).toMatchObject({
      id: "reservation-test",
      courtId: "court-agave",
      date: "2026-04-24",
      startHour: 6,
      durationHours: 1,
      status: "booked",
      paymentStatus: "unpaid",
      total: 300 + addOnTotal,
    });
    expect(result.state.reservations).toHaveLength(state.reservations.length + 1);
    expect(
      getSlotStatus(result.state, {
        courtId: "court-agave",
        date: "2026-04-24",
        startHour: 6,
      }),
    ).toBe("booked");
  });

  it("rejects reservations for unavailable slots", () => {
    const state = buildInitialBookingState();

    expect(() =>
      createReservation(state, {
        id: "reservation-conflict",
        courtId: "court-agave",
        customer: {
          name: "Mara Santos",
          phone: "0917 555 1000",
          email: "mara@example.com",
          skillLevel: "intermediate",
        },
        date: "2026-04-24",
        startHour: 8,
        durationHours: 1,
        addOnIds: [],
      }),
    ).toThrow("Slot is not available");
  });

  it("updates staff-facing reservation status immutably", () => {
    const state = buildInitialBookingState();
    const existing = state.reservations[0];

    const nextState = updateReservationStatus(state, existing.id, {
      status: "checked-in",
      paymentStatus: "paid",
    });

    expect(nextState.reservations.find((reservation) => reservation.id === existing.id)).toMatchObject({
      status: "checked-in",
      paymentStatus: "paid",
    });
    expect(state.reservations.find((reservation) => reservation.id === existing.id)).toMatchObject({
      status: existing.status,
      paymentStatus: existing.paymentStatus,
    });
  });
});
