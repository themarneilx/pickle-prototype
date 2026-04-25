"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildInitialBookingState } from "./booking-data";
import { createReservation, updateReservationStatus } from "./booking-logic";
import { readBookingState, resetStoredBookingState, writeBookingState } from "./booking-storage";
import type {
  BookingState,
  PaymentStatus,
  Reservation,
  ReservationInput,
  ReservationStatus,
} from "./booking-types";

export function useBookingStore() {
  const [state, setState] = useState<BookingState>(() => buildInitialBookingState());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(readBookingState(window.localStorage));
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      writeBookingState(window.localStorage, state);
    }
  }, [isHydrated, state]);

  const bookReservation = useCallback((input: ReservationInput): Reservation => {
    let createdReservation: Reservation | undefined;
    setState((current) => {
      const result = createReservation(current, input);
      createdReservation = result.reservation;
      return result.state;
    });

    if (!createdReservation) {
      throw new Error("Reservation could not be created");
    }

    return createdReservation;
  }, []);

  const updateStatus = useCallback(
    (reservationId: string, patch: Partial<{ status: ReservationStatus; paymentStatus: PaymentStatus }>) => {
      setState((current) => updateReservationStatus(current, reservationId, patch));
    },
    [],
  );

  const resetDemo = useCallback(() => {
    setState(resetStoredBookingState(window.localStorage));
  }, []);

  const updateBookingState = useCallback((updater: (state: BookingState) => BookingState) => {
    setState((current) => updater(current));
  }, []);

  return useMemo(
    () => ({
      state,
      isHydrated,
      bookReservation,
      updateStatus,
      updateBookingState,
      resetDemo,
    }),
    [bookReservation, isHydrated, resetDemo, state, updateBookingState, updateStatus],
  );
}
