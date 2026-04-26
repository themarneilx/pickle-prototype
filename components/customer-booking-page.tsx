"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, CreditCard, RotateCcw, Smartphone, Sparkles, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { FeatureStrip } from "./feature-strip";
import { HeroCarousel } from "./hero-carousel";
import { SiteNav } from "./site-nav";
import { DEMO_TODAY, formatLongDate, formatShortDate, fromDateKey, toDateKey } from "@/lib/demo-date";
import {
  formatHour,
  getAvailabilityForDate,
  getBookingPaymentMethodLabel,
  getMockPaymentStatusLabel,
  getSlotStatus,
  formatReceiptDateTime,
} from "@/lib/booking-logic";
import { useBookingStore } from "@/lib/use-booking-store";
import type { Court, CourtId, PaymentMethod, Reservation, SkillLevel } from "@/lib/booking-types";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const themeClasses: Record<Court["theme"], string> = {
  sage: "bg-sage text-ink",
  sky: "bg-sky-soft text-ink",
  peach: "bg-peach text-ink",
  butter: "bg-butter text-ink",
};

const paymentMethods: Array<{ id: PaymentMethod; label: string; description: string; icon: LucideIcon }> = [
  {
    id: "credit-debit-card",
    label: "Credit/Debit Card",
    description: "Mock Visa, Mastercard, or bank card payment.",
    icon: CreditCard,
  },
  {
    id: "gcash",
    label: "GCash",
    description: "Mock mobile wallet payment for GCash users.",
    icon: Smartphone,
  },
];

type SelectedSlot = {
  date: string;
  courtId: CourtId;
  startHour: number;
};

type BookingForm = {
  name: string;
  phone: string;
  email: string;
  skillLevel: SkillLevel;
  durationHours: number;
  addOnIds: string[];
  paymentMethod: PaymentMethod;
  note: string;
};

const emptyForm: BookingForm = {
  name: "",
  phone: "",
  email: "",
  skillLevel: "intermediate",
  durationHours: 1,
  addOnIds: [],
  paymentMethod: "credit-debit-card",
  note: "",
};

export function CustomerBookingPage() {
  const { state, isHydrated, bookReservation, resetDemo } = useBookingStore();
  const today = fromDateKey(DEMO_TODAY);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const selectedCourt = selectedSlot ? state.courts.find((court) => court.id === selectedSlot.courtId) : undefined;
  const selectedAddOns = state.addOns.filter((addOn) => form.addOnIds.includes(addOn.id));
  const total = selectedCourt
    ? selectedCourt.hourlyRate * form.durationHours + selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0)
    : 0;

  const monthDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [viewMonth, viewYear]);

  function changeMonth(direction: number) {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function chooseDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function toggleAddOn(addOnId: string) {
    setForm((current) => ({
      ...current,
      addOnIds: current.addOnIds.includes(addOnId)
        ? current.addOnIds.filter((id) => id !== addOnId)
        : [...current.addOnIds, addOnId],
    }));
  }

  function canBookDuration(slot: SelectedSlot, durationHours: number) {
    for (let hour = slot.startHour; hour < slot.startHour + durationHours; hour += 1) {
      if (hour >= state.closeHour || getSlotStatus(state, { ...slot, startHour: hour }) !== "open") {
        return false;
      }
    }
    return true;
  }

  function confirmBooking() {
    if (!selectedSlot || !selectedCourt || !canBookDuration(selectedSlot, form.durationHours)) {
      return;
    }

    const reservation = bookReservation({
      id: `reservation-${crypto.randomUUID()}`,
      courtId: selectedSlot.courtId,
      customer: {
        name: form.name.trim() || "Guest Player",
        phone: form.phone.trim() || "0917 000 0000",
        email: form.email.trim() || "guest@example.com",
        skillLevel: form.skillLevel,
      },
      date: selectedSlot.date,
      startHour: selectedSlot.startHour,
      durationHours: form.durationHours,
      addOnIds: form.addOnIds,
      paymentMethod: form.paymentMethod,
      note: form.note.trim() || undefined,
    });

    setConfirmedReservation(reservation);
    setSelectedSlot(null);
    setForm(emptyForm);
  }

  return (
    <main className="min-h-screen bg-cream">
      <SiteNav />
      <HeroCarousel />
      <FeatureStrip />

      <section id="booking" className="px-[6vw] py-16 lg:px-[8vw] lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-peach-pale px-4 py-2 text-sm font-bold text-coral">
                <Sparkles size={16} aria-hidden="true" />
                Online booking
              </div>
              <h2 className="font-serif text-4xl font-black text-ink md:text-6xl">Pick a date, pick your court.</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
                Select a day to see live mock availability across all four courts. Reservations update the demo schedule
                immediately.
              </p>
            </div>
            <button
              className="inline-flex w-fit items-center gap-2 rounded-full border border-border-soft bg-white px-5 py-3 text-sm font-bold text-ink shadow-sm transition hover:border-coral hover:text-coral"
              type="button"
              onClick={resetDemo}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reset demo
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <aside className="h-fit rounded-lg border border-border-soft bg-white p-5 shadow-[0_10px_35px_rgba(44,58,46,0.08)] lg:sticky lg:top-24">
              <div className="mb-5 flex items-center justify-between">
                <button
                  className="grid h-10 w-10 place-items-center rounded-full bg-sage-pale text-ink transition hover:bg-sage-light"
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <div className="font-serif text-2xl font-bold">
                  {monthNames[viewMonth]} {viewYear}
                </div>
                <button
                  className="grid h-10 w-10 place-items-center rounded-full bg-sage-pale text-ink transition hover:bg-sage-light"
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-bold text-ink-soft">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const date = toDateKey(new Date(viewYear, viewMonth, day));
                  const availability = getAvailabilityForDate(state, date);
                  const isPast = date < DEMO_TODAY;
                  const isSelected = date === selectedDate;
                  const isToday = date === DEMO_TODAY;
                  const stateClass = isSelected
                    ? "bg-ink text-white"
                    : isToday
                      ? "border-coral text-coral"
                      : availability.status === "limited"
                        ? "border-butter bg-butter-light text-ink"
                        : availability.status === "full"
                          ? "border-border-soft bg-sage-pale text-ink-soft"
                          : "border-sage-light text-ink hover:border-sage hover:bg-sage-pale";

                  return (
                    <button
                      key={date}
                      className={`relative aspect-square rounded-lg border text-sm font-bold transition ${stateClass} ${
                        isPast ? "cursor-not-allowed opacity-35" : ""
                      }`}
                      type="button"
                      disabled={isPast}
                      onClick={() => chooseDate(date)}
                    >
                      {day}
                      {!isPast && availability.openSlots > 0 ? (
                        <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-current opacity-60" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 grid gap-2 text-sm text-ink-soft">
                <Legend color="bg-sage" label="Has availability" />
                <Legend color="bg-butter" label="Limited" />
                <Legend color="bg-coral" label="Today" />
              </div>
            </aside>

            <section id="courts" className="space-y-5">
              <div className="rounded-lg border border-border-soft bg-white p-5 shadow-[0_10px_35px_rgba(44,58,46,0.08)]">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-coral">
                      <CalendarDays size={16} aria-hidden="true" />
                      {formatLongDate(selectedDate)}
                    </div>
                    <h3 className="mt-2 font-serif text-3xl font-black text-ink">
                      {getAvailabilityForDate(state, selectedDate).openSlots} open slots
                    </h3>
                  </div>
                  <div className="text-sm text-ink-soft">
                    {isHydrated ? "Demo data saved in this browser" : "Loading demo data"}
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                {state.courts.map((court) => {
                  const reservationPanel =
                    selectedSlot?.courtId === court.id && selectedCourt ? (
                      <ReservationPanel
                        canBook={canBookDuration(selectedSlot, form.durationHours)}
                        court={court}
                        form={form}
                        selectedDate={selectedSlot.date}
                        selectedHour={selectedSlot.startHour}
                        setForm={setForm}
                        total={total}
                        addOns={state.addOns}
                        onToggleAddOn={toggleAddOn}
                        onClear={() => setSelectedSlot(null)}
                        onConfirm={confirmBooking}
                      />
                    ) : null;

                  return (
                    <CourtAvailability
                      key={court.id}
                      court={court}
                      reservationPanel={reservationPanel}
                      selectedDate={selectedDate}
                      selectedSlot={selectedSlot}
                      state={state}
                      onSelect={(slot) => setSelectedSlot(slot)}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </section>

      <footer className="bg-ink px-[6vw] py-10 text-sm text-white/65 lg:px-[8vw]">
        <p>
          <strong className="text-white/85">SmashCourt Pickleball</strong> - Cebu City · Open daily 6am - 10pm ·
          (032) 555-0123
        </p>
        <p className="mt-2">© 2026 SmashCourt. All rights reserved.</p>
      </footer>

      {confirmedReservation ? (
        <ConfirmationModal
          addOns={state.addOns}
          reservation={confirmedReservation}
          court={state.courts.find((court) => court.id === confirmedReservation.courtId)}
          onClose={() => setConfirmedReservation(null)}
        />
      ) : null}
    </main>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}

export function CourtAvailability({
  court,
  reservationPanel,
  selectedDate,
  selectedSlot,
  state,
  onSelect,
}: {
  court: Court;
  reservationPanel?: React.ReactNode;
  selectedDate: string;
  selectedSlot: SelectedSlot | null;
  state: ReturnType<typeof useBookingStore>["state"];
  onSelect: (slot: SelectedSlot) => void;
}) {
  const hours = Array.from({ length: state.closeHour - state.openHour }, (_, index) => state.openHour + index);
  const openCount = hours.filter(
    (hour) => getSlotStatus(state, { courtId: court.id, date: selectedDate, startHour: hour }) === "open",
  ).length;

  return (
    <article className="rounded-lg border border-border-soft bg-white p-5 shadow-[0_10px_35px_rgba(44,58,46,0.08)]">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className={`grid h-14 w-14 place-items-center rounded-lg font-serif text-2xl font-bold ${themeClasses[court.theme]}`}>
            {court.shortName.charAt(0)}
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-ink">{court.name}</h3>
            <p className="mt-1 text-sm text-ink-soft">
              {court.type} · {court.surface}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {court.amenities.map((amenity) => (
                <span key={amenity} className="rounded-full bg-sage-pale px-3 py-1 text-xs font-semibold text-ink-mid">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-left md:text-right">
          <div className="font-serif text-2xl font-black text-ink">₱{court.hourlyRate}</div>
          <div className="text-xs font-semibold uppercase text-ink-soft">per hour</div>
          <div className="mt-2 text-sm font-bold text-coral">{openCount} open</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {hours.map((hour) => {
          const status = getSlotStatus(state, { courtId: court.id, date: selectedDate, startHour: hour });
          const isSelected =
            selectedSlot?.courtId === court.id &&
            selectedSlot.date === selectedDate &&
            selectedSlot.startHour === hour;
          const statusClass =
            status === "booked"
              ? "cursor-not-allowed border-border-soft bg-sage-pale text-ink-soft"
              : status === "closed"
                ? "cursor-not-allowed border-border-soft bg-peach-pale text-ink-soft"
                : isSelected
                  ? "border-ink bg-ink text-white"
                  : "border-sage-light bg-white text-ink hover:border-coral hover:bg-peach-pale";

          return (
            <button
              key={`${court.id}-${hour}`}
              className={`min-h-16 rounded-lg border p-2 text-left transition ${statusClass}`}
              type="button"
              disabled={status !== "open"}
              onClick={() => onSelect({ date: selectedDate, courtId: court.id, startHour: hour })}
            >
              <span className="block text-sm font-bold">{formatHour(hour)}</span>
              <span className="mt-1 block text-xs font-semibold uppercase">
                {status === "open" ? (isSelected ? "Selected" : "Open") : status === "closed" ? "Closed" : "Booked"}
              </span>
            </button>
          );
        })}
      </div>

      {reservationPanel ? <div className="mt-5">{reservationPanel}</div> : null}
    </article>
  );
}

function ReservationPanel({
  addOns,
  canBook,
  court,
  form,
  selectedDate,
  selectedHour,
  setForm,
  total,
  onToggleAddOn,
  onClear,
  onConfirm,
}: {
  addOns: ReturnType<typeof useBookingStore>["state"]["addOns"];
  canBook: boolean;
  court: Court;
  form: BookingForm;
  selectedDate: string;
  selectedHour: number;
  setForm: React.Dispatch<React.SetStateAction<BookingForm>>;
  total: number;
  onToggleAddOn: (addOnId: string) => void;
  onClear: () => void;
  onConfirm: () => void;
}) {
  const canSubmit = canBook && form.name.trim().length > 1 && form.phone.trim().length > 5 && form.email.includes("@");

  return (
    <section className="rounded-lg border border-coral/35 bg-peach-pale p-5 shadow-[0_10px_35px_rgba(44,58,46,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-coral">Reserve this slot</div>
          <h3 className="mt-1 font-serif text-3xl font-black text-ink">{court.name}</h3>
          <p className="mt-1 text-sm text-ink-soft">
            {formatShortDate(selectedDate)} · {formatHour(selectedHour)} - {formatHour(selectedHour + form.durationHours)}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-ink transition hover:text-coral"
          type="button"
          onClick={onClear}
        >
          <X size={15} aria-hidden="true" />
          Clear
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-ink">
          Name
          <input
            className="rounded-lg border border-border-soft bg-white px-4 py-3 font-normal text-ink"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Guest name"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink">
          Phone
          <input
            className="rounded-lg border border-border-soft bg-white px-4 py-3 font-normal text-ink"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="0917 000 0000"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink">
          Email
          <input
            className="rounded-lg border border-border-soft bg-white px-4 py-3 font-normal text-ink"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="guest@example.com"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
        <label className="grid gap-2 text-sm font-bold text-ink">
          Skill level
          <select
            className="rounded-lg border border-border-soft bg-white px-4 py-3 font-normal text-ink"
            value={form.skillLevel}
            onChange={(event) => setForm((current) => ({ ...current, skillLevel: event.target.value as SkillLevel }))}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="open-play">Open play</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink">
          Duration
          <select
            className="rounded-lg border border-border-soft bg-white px-4 py-3 font-normal text-ink"
            value={form.durationHours}
            onChange={(event) =>
              setForm((current) => ({ ...current, durationHours: Number(event.target.value) }))
            }
          >
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-ink">
          Notes
          <input
            className="rounded-lg border border-border-soft bg-white px-4 py-3 font-normal text-ink"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            placeholder="Optional request"
          />
        </label>
      </div>

      <div className="mt-5">
        <div className="mb-3 text-sm font-bold text-ink">Add-ons</div>
        <div className="grid gap-3 md:grid-cols-2">
          {addOns.map((addOn) => {
            const checked = form.addOnIds.includes(addOn.id);
            return (
              <label
                key={addOn.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 transition ${
                  checked ? "border-coral" : "border-border-soft hover:border-sage"
                }`}
              >
                <input
                  className="mt-1 h-4 w-4 accent-coral"
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleAddOn(addOn.id)}
                />
                <span>
                  <span className="block text-sm font-bold text-ink">
                    {addOn.name} · ₱{addOn.price}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">{addOn.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 text-sm font-bold text-ink">Payment method</div>
        <div className="grid gap-3 md:grid-cols-2">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const checked = form.paymentMethod === method.id;
            return (
              <label
                key={method.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 transition ${
                  checked ? "border-coral" : "border-border-soft hover:border-sage"
                }`}
              >
                <input
                  className="mt-1 h-4 w-4 accent-coral"
                  type="radio"
                  name="payment-method"
                  checked={checked}
                  onChange={() => setForm((current) => ({ ...current, paymentMethod: method.id }))}
                />
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-pale text-ink">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{method.label}</span>
                  <span className="mt-1 block text-sm text-ink-soft">{method.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 border-t border-coral/20 pt-5 md:flex-row md:items-center">
        <div>
          <div className="text-sm font-bold text-ink-soft">Total</div>
          <div className="font-serif text-4xl font-black text-ink">₱{total.toLocaleString()}</div>
          {!canBook ? <div className="mt-1 text-sm font-bold text-coral">The selected duration overlaps a booking.</div> : null}
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-7 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          disabled={!canSubmit}
          onClick={onConfirm}
        >
          <Check size={17} aria-hidden="true" />
          Confirm Reservation
        </button>
      </div>
    </section>
  );
}

export function ConfirmationModal({
  addOns,
  reservation,
  court,
  onClose,
}: {
  addOns: ReturnType<typeof useBookingStore>["state"]["addOns"];
  reservation: Reservation;
  court: Court | undefined;
  onClose: () => void;
}) {
  const selectedAddOns = addOns.filter((addOn) => reservation.addOnIds.includes(addOn.id));

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/55 px-5 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg bg-white p-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sage-pale text-coral">
          <Check size={32} aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-serif text-3xl font-black text-ink">Reservation confirmed</h2>
        <p className="mt-4 leading-7 text-ink-soft">
          Your reservation is confirmed for <strong className="text-ink">{court?.name ?? "your court"}</strong> on{" "}
          <strong className="text-ink">{formatLongDate(reservation.date)}</strong> at{" "}
          <strong className="text-ink">{formatHour(reservation.startHour)}</strong>.
        </p>
        <div className="mt-5 rounded-lg bg-sage-pale p-4 text-left text-sm text-ink-mid">
          <div className="flex justify-between">
            <span>Payment status</span>
            <strong className="text-ink">{getMockPaymentStatusLabel(reservation.paymentStatus)}</strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Invoice</span>
            <strong className="text-ink">{reservation.invoiceNumber ?? "Not issued"}</strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Payment reference</span>
            <strong className="text-ink">{reservation.paymentReference ?? "Not issued"}</strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Paid at</span>
            <strong className="text-ink">{formatReceiptDateTime(reservation.paidAt)}</strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Payment method</span>
            <strong className="text-ink">{getBookingPaymentMethodLabel(reservation.paymentMethod)}</strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Reservation</span>
            <strong className="text-ink">{reservation.id.slice(-8)}</strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Time</span>
            <strong className="text-ink">
              {formatHour(reservation.startHour)} - {formatHour(reservation.startHour + reservation.durationHours)}
            </strong>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Add-ons</span>
            <strong className="text-ink">
              {selectedAddOns.length ? selectedAddOns.map((addOn) => addOn.name).join(", ") : "None"}
            </strong>
          </div>
          <div className="mt-3 flex justify-between border-t border-border-soft pt-3">
            <span>Total paid</span>
            <strong className="text-ink">₱{reservation.total.toLocaleString()}</strong>
          </div>
        </div>
        <button
          className="mt-6 w-full rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition hover:bg-coral"
          type="button"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}
