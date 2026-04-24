import type {
  BookingState,
  CourtId,
  DateAvailability,
  PaymentStatus,
  Reservation,
  ReservationInput,
  ReservationStatus,
  SlotStatus,
} from "./booking-types";

type SlotQuery = {
  courtId: CourtId;
  date: string;
  startHour: number;
};

const unavailableStatuses: ReservationStatus[] = ["booked", "checked-in", "completed", "no-show"];

export function formatHour(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

export function getSlotStatus(state: BookingState, query: SlotQuery): SlotStatus {
  const closure = state.closures.find(
    (item) => item.date === query.date && item.courtIds.includes(query.courtId),
  );
  if (closure) {
    return "closed";
  }

  const reservation = state.reservations.find(
    (item) =>
      item.courtId === query.courtId &&
      item.date === query.date &&
      query.startHour >= item.startHour &&
      query.startHour < item.startHour + item.durationHours &&
      unavailableStatuses.includes(item.status),
  );

  return reservation ? "booked" : "open";
}

export function getAvailabilityForDate(state: BookingState, date: string): DateAvailability {
  let totalSlots = 0;
  let bookedSlots = 0;
  let closedSlots = 0;
  let openSlots = 0;

  for (const court of state.courts) {
    for (let hour = state.openHour; hour < state.closeHour; hour += 1) {
      totalSlots += 1;
      const status = getSlotStatus(state, { courtId: court.id, date, startHour: hour });
      if (status === "booked") {
        bookedSlots += 1;
      }
      if (status === "closed") {
        closedSlots += 1;
      }
      if (status === "open") {
        openSlots += 1;
      }
    }
  }

  const usableSlots = totalSlots - closedSlots;
  const status =
    usableSlots === 0 || openSlots === 0
      ? "full"
      : openSlots <= Math.ceil(usableSlots * 0.25)
        ? "limited"
        : "available";

  return {
    totalSlots,
    bookedSlots,
    openSlots,
    closedSlots,
    status,
  };
}

export function createReservation(
  state: BookingState,
  input: ReservationInput,
): { state: BookingState; reservation: Reservation } {
  const court = state.courts.find((item) => item.id === input.courtId);
  if (!court) {
    throw new Error("Court not found");
  }

  for (let hour = input.startHour; hour < input.startHour + input.durationHours; hour += 1) {
    if (getSlotStatus(state, { courtId: input.courtId, date: input.date, startHour: hour }) !== "open") {
      throw new Error("Slot is not available");
    }
  }

  const existingCustomer = state.customers.find(
    (customer) => customer.email.toLowerCase() === input.customer.email.toLowerCase(),
  );
  const customer = existingCustomer ?? {
    ...input.customer,
    id: `customer-${slugify(input.customer.name)}-${Date.now()}`,
  };
  const addOnTotal = input.addOnIds.reduce((sum, addOnId) => {
    const addOn = state.addOns.find((item) => item.id === addOnId);
    return sum + (addOn?.price ?? 0);
  }, 0);
  const reservation: Reservation = {
    id: input.id ?? `reservation-${Date.now()}`,
    courtId: input.courtId,
    customerId: customer.id,
    date: input.date,
    startHour: input.startHour,
    durationHours: input.durationHours,
    addOnIds: [...input.addOnIds],
    status: "booked",
    paymentStatus: "unpaid",
    total: court.hourlyRate * input.durationHours + addOnTotal,
    createdAt: new Date().toISOString(),
    note: input.note,
  };

  return {
    reservation,
    state: {
      ...state,
      customers: existingCustomer ? state.customers : [...state.customers, customer],
      reservations: [...state.reservations, reservation],
    },
  };
}

export function updateReservationStatus(
  state: BookingState,
  reservationId: string,
  patch: Partial<Pick<Reservation, "status" | "paymentStatus">>,
): BookingState {
  return {
    ...state,
    reservations: state.reservations.map((reservation) =>
      reservation.id === reservationId
        ? {
            ...reservation,
            status: patch.status ?? reservation.status,
            paymentStatus: patch.paymentStatus ?? reservation.paymentStatus,
          }
        : reservation,
    ),
  };
}

export function getReservationsForDate(state: BookingState, date: string): Reservation[] {
  return state.reservations
    .filter((reservation) => reservation.date === date)
    .toSorted((a, b) => a.startHour - b.startHour || a.courtId.localeCompare(b.courtId));
}

export function getReservationCustomer(state: BookingState, reservation: Reservation) {
  return state.customers.find((customer) => customer.id === reservation.customerId);
}

export function getReservationCourt(state: BookingState, reservation: Reservation) {
  return state.courts.find((court) => court.id === reservation.courtId);
}

export function getStatusLabel(status: ReservationStatus): string {
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getPaymentLabel(status: PaymentStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
