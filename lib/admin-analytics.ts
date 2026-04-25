import type { BookingState, CourtId, Reservation } from "./booking-types";
import { formatHour } from "./booking-logic";

const reportStatuses = new Set(["booked", "checked-in", "completed"]);

export type AdminSummary = {
  confirmedBookings: number;
  totalRevenue: number;
  averageRevenuePerBooking: number;
  utilization: number;
};

export type RevenuePoint = {
  date: string;
  revenue: number;
  bookings: number;
};

export type HourlyDemandAnalysis = {
  peakHour: number;
  peakBookings: number;
  slowHour: number;
  slowBookings: number;
  busiestDay: string;
  recommendation: string;
};

export type CourtUtilization = {
  courtId: CourtId;
  bookedSlots: number;
  totalSlots: number;
  utilization: number;
};

export type HeatmapCell = {
  day: string;
  hour: number;
  bookings: number;
  intensity: number;
};

export function getReservationsInRange(state: BookingState, startDate: string, endDate: string): Reservation[] {
  return state.reservations.filter(
    (reservation) =>
      reservation.date >= startDate && reservation.date <= endDate && reportStatuses.has(reservation.status),
  );
}

export function getAdminSummary(state: BookingState, startDate: string, endDate: string): AdminSummary {
  const reservations = getReservationsInRange(state, startDate, endDate);
  const totalRevenue = reservations.reduce((sum, reservation) => sum + reservation.total, 0);
  const days = getDateKeys(startDate, endDate).length;
  const totalSlots = days * state.courts.length * (state.closeHour - state.openHour);
  const bookedSlots = reservations.reduce((sum, reservation) => sum + reservation.durationHours, 0);

  return {
    confirmedBookings: reservations.length,
    totalRevenue,
    averageRevenuePerBooking: reservations.length ? Math.round(totalRevenue / reservations.length) : 0,
    utilization: totalSlots ? Math.round((bookedSlots / totalSlots) * 100) : 0,
  };
}

export function getRevenueSeries(state: BookingState, startDate: string, endDate: string): RevenuePoint[] {
  return getDateKeys(startDate, endDate).map((date) => {
    const reservations = getReservationsInRange(state, date, date);
    return {
      date,
      revenue: reservations.reduce((sum, reservation) => sum + reservation.total, 0),
      bookings: reservations.length,
    };
  });
}

export function getCourtUtilizationRanking(
  state: BookingState,
  startDate: string,
  endDate: string,
): CourtUtilization[] {
  const reservations = getReservationsInRange(state, startDate, endDate);
  const days = getDateKeys(startDate, endDate).length;
  const totalSlots = days * (state.closeHour - state.openHour);

  return state.courts
    .map((court) => {
      const bookedSlots = reservations
        .filter((reservation) => reservation.courtId === court.id)
        .reduce((sum, reservation) => sum + reservation.durationHours, 0);

      return {
        courtId: court.id,
        bookedSlots,
        totalSlots,
        utilization: totalSlots ? Math.round((bookedSlots / totalSlots) * 100) : 0,
      };
    })
    .toSorted((a, b) => b.utilization - a.utilization);
}

export function getHourlyDemandAnalysis(
  state: BookingState,
  startDate: string,
  endDate: string,
): HourlyDemandAnalysis {
  const reservations = getReservationsInRange(state, startDate, endDate);
  const hourCounts = new Map<number, number>();
  const dayCounts = new Map<string, number>();

  for (let hour = state.openHour; hour < state.closeHour; hour += 1) {
    hourCounts.set(hour, 0);
  }

  for (const date of getDateKeys(startDate, endDate)) {
    dayCounts.set(date, 0);
  }

  for (const reservation of reservations) {
    hourCounts.set(reservation.startHour, (hourCounts.get(reservation.startHour) ?? 0) + 1);
    dayCounts.set(reservation.date, (dayCounts.get(reservation.date) ?? 0) + 1);
  }

  const peak = [...hourCounts.entries()].reduce(
    (best, current) => (current[1] > best[1] ? current : best),
    [state.openHour, 0] as [number, number],
  );
  const slow = [...hourCounts.entries()].reduce(
    (best, current) => (current[1] < best[1] ? current : best),
    [state.openHour, Number.POSITIVE_INFINITY] as [number, number],
  );
  const busiestDay = [...dayCounts.entries()].reduce(
    (best, current) => (current[1] > best[1] ? current : best),
    [startDate, 0] as [string, number],
  )[0];

  return {
    peakHour: peak[0],
    peakBookings: peak[1],
    slowHour: slow[0],
    slowBookings: slow[1],
    busiestDay,
    recommendation: `${formatHour(slow[0])} is the softest window. Consider a weekday starter promo, while adding staff coverage around ${formatHour(peak[0])}.`,
  };
}

export function getHourlyHeatmap(state: BookingState, startDate: string, endDate: string): HeatmapCell[] {
  const reservations = getReservationsInRange(state, startDate, endDate);
  const cells: HeatmapCell[] = [];
  let maxBookings = 0;

  for (const date of getDateKeys(startDate, endDate)) {
    for (let hour = state.openHour; hour < state.closeHour; hour += 1) {
      const bookings = reservations.filter(
        (reservation) => reservation.date === date && reservation.startHour === hour,
      ).length;
      maxBookings = Math.max(maxBookings, bookings);
      cells.push({ day: date, hour, bookings, intensity: 0 });
    }
  }

  return cells.map((cell) => ({
    ...cell,
    intensity: maxBookings ? Math.round((cell.bookings / maxBookings) * 100) : 0,
  }));
}

function getDateKeys(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  while (cursor <= end) {
    dates.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
