import { buildInitialBookingState, STORAGE_KEY, STORAGE_VERSION } from "./booking-data";
import type { BookingState } from "./booking-types";

export type BookingStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readBookingState(storage: BookingStorage | undefined): BookingState {
  if (!storage) {
    return buildInitialBookingState();
  }

  const rawValue = storage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return buildInitialBookingState();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<BookingState>;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.reservations)) {
      return resetStoredBookingState(storage);
    }
    return parsed as BookingState;
  } catch {
    return resetStoredBookingState(storage);
  }
}

export function writeBookingState(storage: BookingStorage | undefined, state: BookingState): void {
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetStoredBookingState(storage: BookingStorage | undefined): BookingState {
  const state = buildInitialBookingState();
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}
