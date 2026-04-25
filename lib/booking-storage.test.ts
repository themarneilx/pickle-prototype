import { describe, expect, it } from "vitest";

import { buildInitialBookingState, STORAGE_KEY, STORAGE_VERSION } from "./booking-data";
import { readBookingState, resetStoredBookingState, writeBookingState } from "./booking-storage";

function createMemoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    snapshot: () => Object.fromEntries(data),
  };
}

describe("booking storage", () => {
  it("falls back to seeded state when storage is empty", () => {
    const storage = createMemoryStorage();

    expect(readBookingState(storage)).toMatchObject({
      version: STORAGE_VERSION,
      reservations: expect.arrayContaining([
        expect.objectContaining({ id: "reservation-001" }),
      ]),
    });
  });

  it("writes and reads the persisted booking state", () => {
    const storage = createMemoryStorage();
    const state = buildInitialBookingState();
    const nextState = {
      ...state,
      reservations: state.reservations.slice(0, 1),
    };

    writeBookingState(storage, nextState);

    expect(readBookingState(storage).reservations).toHaveLength(1);
    expect(storage.snapshot()[STORAGE_KEY]).toContain("reservation-001");
  });

  it("resets invalid or stale storage to the seeded state", () => {
    const storage = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 0, reservations: [] }),
    });

    expect(resetStoredBookingState(storage).reservations.length).toBeGreaterThan(1);
    expect(readBookingState(storage).reservations.length).toBeGreaterThan(1);
  });
});
