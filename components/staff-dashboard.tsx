"use client";

import Link from "next/link";
import { ArrowLeft, Banknote, CheckCircle2, RotateCcw, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SiteNav } from "./site-nav";
import { DEMO_TODAY, formatLongDate } from "@/lib/demo-date";
import {
  formatHour,
  getPaymentLabel,
  getReservationCourt,
  getReservationCustomer,
  getReservationsForDate,
  getStatusLabel,
} from "@/lib/booking-logic";
import { useBookingStore } from "@/lib/use-booking-store";
import type { PaymentStatus, ReservationStatus } from "@/lib/booking-types";

const reservationStatuses: ReservationStatus[] = ["booked", "checked-in", "completed", "cancelled", "no-show"];
const paymentStatuses: PaymentStatus[] = ["unpaid", "paid", "refunded"];

export function StaffDashboard() {
  const { state, updateStatus, resetDemo } = useBookingStore();
  const reservations = getReservationsForDate(state, DEMO_TODAY);
  const activeReservations = reservations.filter((reservation) => reservation.status !== "cancelled");
  const revenue = activeReservations
    .filter((reservation) => reservation.paymentStatus === "paid")
    .reduce((sum, reservation) => sum + reservation.total, 0);
  const checkedIn = reservations.filter((reservation) => reservation.status === "checked-in").length;
  const openToday = state.courts.length * (state.closeHour - state.openHour) - activeReservations.length;

  return (
    <main className="min-h-screen bg-sage-pale">
      <SiteNav active="staff" />
      <section className="px-[6vw] pb-16 pt-28 lg:px-[8vw]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <Link className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-coral" href="/">
                <ArrowLeft size={16} aria-hidden="true" />
                Back to booking site
              </Link>
              <h1 className="font-serif text-5xl font-black text-ink md:text-6xl">Today&apos;s court board</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
                Staff view for {formatLongDate(DEMO_TODAY)}. Update check-ins, payments, cancellations, and see the
                same local mock data reflected on the booking page.
              </p>
            </div>
            <button
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink shadow-sm transition hover:text-coral"
              type="button"
              onClick={resetDemo}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reset demo
            </button>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Metric icon={Users} label="Reservations" value={reservations.length.toString()} />
            <Metric icon={CheckCircle2} label="Checked in" value={checkedIn.toString()} />
            <Metric icon={Banknote} label="Paid revenue" value={`₱${revenue.toLocaleString()}`} />
            <Metric icon={Users} label="Open slots" value={openToday.toString()} />
          </div>

          <section className="overflow-hidden rounded-lg border border-border-soft bg-white shadow-[0_10px_35px_rgba(44,58,46,0.08)]">
            <div className="grid grid-cols-[1.2fr_0.8fr_1fr_0.8fr_0.8fr] gap-4 border-b border-border-soft bg-cream px-5 py-4 text-xs font-bold uppercase text-ink-soft max-lg:hidden">
              <div>Guest</div>
              <div>Court</div>
              <div>Time</div>
              <div>Status</div>
              <div>Payment</div>
            </div>
            <div className="divide-y divide-border-soft">
              {reservations.map((reservation) => {
                const court = getReservationCourt(state, reservation);
                const customer = getReservationCustomer(state, reservation);
                return (
                  <article
                    key={reservation.id}
                    className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr_0.8fr_1fr_0.8fr_0.8fr] lg:items-center"
                  >
                    <div>
                      <div className="font-bold text-ink">{customer?.name ?? "Guest player"}</div>
                      <div className="mt-1 text-sm text-ink-soft">{customer?.phone ?? "No phone"}</div>
                    </div>
                    <div>
                      <div className="font-bold text-ink">{court?.shortName ?? reservation.courtId}</div>
                      <div className="mt-1 text-sm text-ink-soft">{court?.type}</div>
                    </div>
                    <div className="font-bold text-ink">
                      {formatHour(reservation.startHour)} - {formatHour(reservation.startHour + reservation.durationHours)}
                      <div className="mt-1 text-sm font-normal text-ink-soft">₱{reservation.total.toLocaleString()}</div>
                    </div>
                    <label className="grid gap-2 text-sm font-bold text-ink lg:gap-1">
                      <span className="lg:hidden">Status</span>
                      <select
                        className="rounded-lg border border-border-soft bg-white px-3 py-2 font-normal"
                        value={reservation.status}
                        onChange={(event) =>
                          updateStatus(reservation.id, { status: event.target.value as ReservationStatus })
                        }
                      >
                        {reservationStatuses.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-ink lg:gap-1">
                      <span className="lg:hidden">Payment</span>
                      <select
                        className="rounded-lg border border-border-soft bg-white px-3 py-2 font-normal"
                        value={reservation.paymentStatus}
                        onChange={(event) =>
                          updateStatus(reservation.id, { paymentStatus: event.target.value as PaymentStatus })
                        }
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {getPaymentLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border-soft bg-white p-5 shadow-[0_10px_35px_rgba(44,58,46,0.08)]">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-peach-pale text-coral">
        <Icon size={19} aria-hidden="true" />
      </div>
      <div className="font-serif text-3xl font-black text-ink">{value}</div>
      <div className="mt-1 text-sm font-bold uppercase text-ink-soft">{label}</div>
    </div>
  );
}
