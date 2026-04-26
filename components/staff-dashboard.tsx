"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  CalendarDays,
  Camera,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  GalleryHorizontalEnd,
  Info,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DEMO_TODAY, formatLongDate } from "@/lib/demo-date";
import {
  getAdminSummary,
  getCourtUtilizationRanking,
  getHourlyDemandAnalysis,
  getHourlyHeatmap,
  getRevenueSeries,
} from "@/lib/admin-analytics";
import { setCourtHourlyRate, setPricingRulePrice } from "@/lib/admin-mutations";
import {
  formatHour,
  formatReceiptDateTime,
  getBookingPaymentMethodLabel,
  getMockPaymentStatusLabel,
  getPaymentLabel,
  getReservationCourt,
  getReservationCustomer,
  getReservationsForDate,
  getStatusLabel,
} from "@/lib/booking-logic";
import { useBookingStore } from "@/lib/use-booking-store";
import type {
  BookingState,
  Court,
  CourtId,
  DayKey,
  GalleryItem,
  PaymentStatus,
  Reservation,
  ReservationStatus,
} from "@/lib/booking-types";

type AdminSection =
  | "bookings"
  | "schedule"
  | "courts"
  | "privacy"
  | "gallery"
  | "reports"
  | "about"
  | "billing";

type StaffDashboardProps = {
  initialSection?: AdminSection;
  initialSelectedReservationId?: string | null;
};

type NavItem = {
  id: AdminSection;
  label: string;
  icon: LucideIcon;
  primaryMobile?: boolean;
};

const navItems: NavItem[] = [
  { id: "bookings", label: "Bookings", icon: ReceiptText, primaryMobile: true },
  { id: "schedule", label: "Schedule", icon: CalendarDays, primaryMobile: true },
  { id: "courts", label: "Courts", icon: LayoutGrid, primaryMobile: true },
  { id: "privacy", label: "Privacy Statements", icon: FileText },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontalEnd },
  { id: "reports", label: "Reports", icon: BarChart3, primaryMobile: true },
  { id: "about", label: "About", icon: Info },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const reservationStatuses: ReservationStatus[] = ["booked", "checked-in", "completed", "cancelled", "no-show"];
const paymentStatuses: PaymentStatus[] = ["unpaid", "paid", "refunded"];
const dayOrder: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const statusBuckets: Array<{ status: ReservationStatus; label: string; tone: string }> = [
  { status: "booked", label: "Pending", tone: "border-butter bg-butter-light text-ink" },
  { status: "checked-in", label: "Confirmed", tone: "border-sage bg-sage-pale text-ink" },
  { status: "completed", label: "Completed", tone: "border-sky-soft bg-sky-light text-ink" },
  { status: "cancelled", label: "Cancelled", tone: "border-coral bg-peach-pale text-coral" },
  { status: "no-show", label: "No-show", tone: "border-ink-soft bg-white text-ink-soft" },
];

const galleryTone: Record<GalleryItem["accent"], string> = {
  sage: "from-sage/70 to-sage-pale",
  sky: "from-sky-soft/80 to-sky-light",
  peach: "from-peach/80 to-peach-pale",
  butter: "from-butter/90 to-butter-light",
};

export function StaffDashboard({ initialSection = "bookings", initialSelectedReservationId = null }: StaffDashboardProps) {
  const { state, updateStatus, updateBookingState, resetDemo } = useBookingStore();
  const [activeSection, setActiveSection] = useState<AdminSection>(initialSection);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(DEMO_TODAY);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(initialSelectedReservationId);
  const [bookingFilters, setBookingFilters] = useState({
    reference: "",
    date: "",
    status: "all",
    courtId: "all",
  });
  const [reportRange, setReportRange] = useState({
    start: "2026-04-24",
    end: "2026-04-30",
  });

  const activeItem = navItems.find((item) => item.id === activeSection) ?? navItems[0];

  function updateOperatingHour(day: DayKey, patch: Partial<{ openHour: number; closeHour: number }>) {
    updateBookingState((current) => ({
      ...current,
      operatingHours: current.operatingHours.map((item) => (item.day === day ? { ...item, ...patch } : item)),
    }));
  }

  function updatePricingRulePrice(ruleId: string, price: number) {
    updateBookingState((current) => setPricingRulePrice(current, ruleId, price));
  }

  function addPricingRule() {
    updateBookingState((current) => ({
      ...current,
      pricingRules: [
        ...current.pricingRules,
        {
          id: `pricing-${Date.now()}`,
          day: "friday",
          label: "New promo window",
          startHour: 15,
          endHour: 18,
          price: 650,
          courtIds: current.courts.map((court) => court.id),
        },
      ],
    }));
  }

  function updateCourtRate(courtId: CourtId, price: number) {
    updateBookingState((current) => setCourtHourlyRate(current, courtId, price));
  }

  function updatePrivacyStatus(id: string) {
    updateBookingState((current) => ({
      ...current,
      privacyStatements: current.privacyStatements.map((item) =>
        item.id === id ? { ...item, status: item.status === "published" ? "review" : "published" } : item,
      ),
    }));
  }

  function updateGalleryStatus(id: string) {
    updateBookingState((current) => ({
      ...current,
      galleryItems: current.galleryItems.map((item) =>
        item.id === id ? { ...item, status: item.status === "published" ? "draft" : "published" } : item,
      ),
    }));
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border-soft bg-sage-pale/95 p-5 shadow-[8px_0_35px_rgba(44,58,46,0.08)] lg:flex lg:flex-col">
          <AdminBrand profile={state.adminProfile} />
          <nav className="mt-7 grid gap-1">
            {navItems.map((item) => (
              <AdminNavButton
                key={item.id}
                item={item}
                active={activeSection === item.id}
                onClick={() => setActiveSection(item.id)}
              />
            ))}
          </nav>
          <div className="mt-auto rounded-lg border border-border-soft bg-white p-4 text-sm text-ink-soft">
            <div className="font-bold text-ink">Demo controls</div>
            <p className="mt-1 leading-6">All admin actions update local mock state in this browser.</p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase text-cream transition hover:bg-coral"
              type="button"
              onClick={resetDemo}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset demo
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 pb-28 lg:ml-72 lg:pb-0">
          <header className="sticky top-0 z-30 border-b border-border-soft bg-cream/90 px-5 py-4 backdrop-blur-xl lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <Link className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-coral" href="/">
                  <ArrowLeft size={15} aria-hidden="true" />
                  Back to booking site
                </Link>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-peach-pale text-coral">
                    <activeItem.icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h1 className="font-serif text-3xl font-black text-ink md:text-4xl">{activeItem.label}</h1>
                    <p className="text-sm text-ink-soft">SmashCourt admin console · {formatLongDate(DEMO_TODAY)}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-coral hover:text-coral lg:hidden"
                  type="button"
                  onClick={resetDemo}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  Reset
                </button>
                <span className="rounded-full bg-sage-pale px-4 py-2 text-sm font-bold text-ink-mid">
                  {state.adminProfile.role}
                </span>
              </div>
            </div>
          </header>

          <div className="px-5 py-6 lg:px-8">
            {activeSection === "bookings" ? (
              <BookingsSection
                filters={bookingFilters}
                onFiltersChange={setBookingFilters}
                selectedReservationId={selectedReservationId}
                setSelectedReservationId={setSelectedReservationId}
                state={state}
                updateStatus={updateStatus}
              />
            ) : null}
            {activeSection === "schedule" ? (
              <ScheduleSection
                date={selectedScheduleDate}
                setDate={setSelectedScheduleDate}
                selectedReservationId={selectedReservationId}
                setSelectedReservationId={setSelectedReservationId}
                state={state}
              />
            ) : null}
            {activeSection === "courts" ? (
              <CourtsSection
                state={state}
                addPricingRule={addPricingRule}
                updateCourtRate={updateCourtRate}
                updatePricingRulePrice={updatePricingRulePrice}
                updateOperatingHour={updateOperatingHour}
              />
            ) : null}
            {activeSection === "reports" ? (
              <ReportsSection range={reportRange} setRange={setReportRange} state={state} />
            ) : null}
            {activeSection === "privacy" ? (
              <PrivacySection state={state} updatePrivacyStatus={updatePrivacyStatus} />
            ) : null}
            {activeSection === "gallery" ? (
              <GallerySection state={state} updateGalleryStatus={updateGalleryStatus} />
            ) : null}
            {activeSection === "about" ? <AboutSection state={state} /> : null}
            {activeSection === "billing" ? <BillingSection state={state} /> : null}
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border-soft bg-cream/95 px-2 py-2 shadow-[0_-10px_35px_rgba(44,58,46,0.12)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems
            .filter((item) => item.primaryMobile)
            .map((item) => (
              <MobileTab
                key={item.id}
                item={item}
                active={activeSection === item.id}
                onClick={() => {
                  setMobileMoreOpen(false);
                  setActiveSection(item.id);
                }}
              />
            ))}
          <button
            className={`grid place-items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold ${
              mobileMoreOpen ? "bg-ink text-cream" : "text-ink-soft"
            }`}
            type="button"
            onClick={() => setMobileMoreOpen((open) => !open)}
          >
            <MoreHorizontal size={18} aria-hidden="true" />
            More
          </button>
        </div>
        {mobileMoreOpen ? (
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-border-soft bg-white p-2">
            {navItems
              .filter((item) => !item.primaryMobile)
              .map((item) => (
                <button
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg bg-sage-pale px-3 py-2 text-sm font-bold text-ink"
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMoreOpen(false);
                  }}
                >
                  <item.icon size={15} aria-hidden="true" />
                  {item.label}
                </button>
              ))}
          </div>
        ) : null}
      </nav>
    </main>
  );
}

function AdminBrand({ profile }: { profile: BookingState["adminProfile"] }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-coral text-white">S</span>
        Pickleball Admin
      </div>
      <div className="mt-6 rounded-lg border border-border-soft bg-white p-4">
        <div className="text-sm font-bold text-ink">{profile.adminName}</div>
        <div className="mt-1 text-xs text-ink-soft">{profile.adminEmail}</div>
        <div className="mt-3 inline-flex rounded-full bg-sky-light px-3 py-1 text-xs font-bold text-ink">
          {profile.role}
        </div>
      </div>
    </div>
  );
}

function AdminNavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold transition ${
        active ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:bg-white/65 hover:text-ink"
      }`}
      type="button"
      onClick={onClick}
    >
      <item.icon size={17} aria-hidden="true" />
      {item.label}
    </button>
  );
}

function MobileTab({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`grid place-items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold ${
        active ? "bg-ink text-cream" : "text-ink-soft"
      }`}
      type="button"
      onClick={onClick}
    >
      <item.icon size={18} aria-hidden="true" />
      {item.label}
    </button>
  );
}

function BookingsSection({
  filters,
  onFiltersChange,
  selectedReservationId,
  setSelectedReservationId,
  state,
  updateStatus,
}: {
  filters: { reference: string; date: string; status: string; courtId: string };
  onFiltersChange: (filters: { reference: string; date: string; status: string; courtId: string }) => void;
  selectedReservationId: string | null;
  setSelectedReservationId: (id: string | null) => void;
  state: BookingState;
  updateStatus: (reservationId: string, patch: Partial<{ status: ReservationStatus; paymentStatus: PaymentStatus }>) => void;
}) {
  const filtered = state.reservations.filter((reservation) => {
    const referenceMatch = reservation.id.toLowerCase().includes(filters.reference.toLowerCase());
    const dateMatch = !filters.date || reservation.date === filters.date;
    const statusMatch = filters.status === "all" || reservation.status === filters.status;
    const courtMatch = filters.courtId === "all" || reservation.courtId === filters.courtId;
    return referenceMatch && dateMatch && statusMatch && courtMatch;
  });

  return (
    <div className="space-y-5">
      <SectionIntro
        eyebrow="Booking desk"
        title="Bookings"
        description="Grouped by status. Expand a row to inspect guest, slot, add-ons, and payment state."
      />
      <div className="rounded-lg border border-border-soft bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <AdminInput
            label="Reference"
            value={filters.reference}
            placeholder="reservation-001"
            onChange={(reference) => onFiltersChange({ ...filters, reference })}
          />
          <AdminInput
            label="Date"
            type="date"
            value={filters.date}
            onChange={(date) => onFiltersChange({ ...filters, date })}
          />
          <AdminSelect
            label="Status"
            value={filters.status}
            onChange={(status) => onFiltersChange({ ...filters, status })}
            options={[{ value: "all", label: "All Statuses" }, ...reservationStatuses.map((status) => ({ value: status, label: getStatusLabel(status) }))]}
          />
          <AdminSelect
            label="Court"
            value={filters.courtId}
            onChange={(courtId) => onFiltersChange({ ...filters, courtId })}
            options={[{ value: "all", label: "All Courts" }, ...state.courts.map((court) => ({ value: court.id, label: court.shortName }))]}
          />
          <button
            className="self-end rounded-full bg-sage-pale px-5 py-3 text-sm font-bold text-ink transition hover:bg-sage-light"
            type="button"
            onClick={() => onFiltersChange({ reference: "", date: "", status: "all", courtId: "all" })}
          >
            Clear all
          </button>
        </div>
      </div>

      {statusBuckets.map((bucket) => {
        const reservations = filtered.filter((reservation) => reservation.status === bucket.status);
        return (
          <section key={bucket.status} className="rounded-lg border border-border-soft bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <span className={`h-3 w-1 rounded-full border ${bucket.tone}`} />
              <h2 className="font-serif text-2xl font-bold text-ink">{bucket.label}</h2>
              <span className="text-sm font-bold text-ink-soft">
                {reservations.length} booking{reservations.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-3">
              {reservations.length ? (
                reservations.map((reservation) => (
                  <BookingRow
                    key={reservation.id}
                    expanded={selectedReservationId === reservation.id}
                    reservation={reservation}
                    state={state}
                    updateStatus={updateStatus}
                    onToggle={() =>
                      setSelectedReservationId(selectedReservationId === reservation.id ? null : reservation.id)
                    }
                  />
                ))
              ) : (
                <EmptyPanel text={`No ${bucket.label.toLowerCase()} bookings found.`} />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function BookingRow({
  expanded,
  reservation,
  state,
  updateStatus,
  onToggle,
}: {
  expanded: boolean;
  reservation: Reservation;
  state: BookingState;
  updateStatus: (reservationId: string, patch: Partial<{ status: ReservationStatus; paymentStatus: PaymentStatus }>) => void;
  onToggle: () => void;
}) {
  const customer = getReservationCustomer(state, reservation);
  const court = getReservationCourt(state, reservation);

  return (
    <article className="rounded-lg border border-border-soft bg-cream p-4">
      <button className="grid w-full gap-3 text-left lg:grid-cols-[1.1fr_0.8fr_0.9fr_0.8fr_auto]" type="button" onClick={onToggle}>
        <div>
          <div className="font-bold text-ink">{customer?.name ?? "Guest player"}</div>
          <div className="text-sm text-ink-soft">{reservation.id}</div>
        </div>
        <div className="font-bold text-ink">{reservation.date}</div>
        <div className="font-bold text-ink">
          {formatHour(reservation.startHour)} - {formatHour(reservation.startHour + reservation.durationHours)}
        </div>
        <div>
          <StatusBadge label={getStatusLabel(reservation.status)} />
        </div>
        <ChevronRight className={`transition ${expanded ? "rotate-90" : ""}`} size={18} aria-hidden="true" />
      </button>
      {expanded ? (
        <div className="mt-4 grid gap-4 border-t border-border-soft pt-4 lg:grid-cols-4">
          <Detail label="Court" value={court?.name ?? reservation.courtId} />
          <Detail label="Contact" value={`${customer?.email ?? "No email"} · ${customer?.phone ?? "No phone"}`} />
          <Detail label="Total" value={`₱${reservation.total.toLocaleString()}`} />
          <Detail label="Add-ons" value={reservation.addOnIds.length ? reservation.addOnIds.join(", ") : "None"} />
          <Detail label="Payment status" value={getMockPaymentStatusLabel(reservation.paymentStatus)} />
          <Detail label="Payment method" value={getBookingPaymentMethodLabel(reservation.paymentMethod)} />
          <Detail label="Invoice" value={reservation.invoiceNumber ?? "Not issued"} />
          <Detail label="Payment reference" value={reservation.paymentReference ?? "Not issued"} />
          <Detail label="Paid at" value={formatReceiptDateTime(reservation.paidAt)} />
          <AdminSelect
            label="Status"
            value={reservation.status}
            onChange={(status) => updateStatus(reservation.id, { status: status as ReservationStatus })}
            options={reservationStatuses.map((status) => ({ value: status, label: getStatusLabel(status) }))}
          />
          <AdminSelect
            label="Payment"
            value={reservation.paymentStatus}
            onChange={(paymentStatus) => updateStatus(reservation.id, { paymentStatus: paymentStatus as PaymentStatus })}
            options={paymentStatuses.map((status) => ({ value: status, label: getPaymentLabel(status) }))}
          />
        </div>
      ) : null}
    </article>
  );
}

function ScheduleSection({
  date,
  setDate,
  selectedReservationId,
  setSelectedReservationId,
  state,
}: {
  date: string;
  setDate: (date: string) => void;
  selectedReservationId: string | null;
  setSelectedReservationId: (id: string | null) => void;
  state: BookingState;
}) {
  const hours = Array.from({ length: state.closeHour - state.openHour }, (_, index) => state.openHour + index);
  const reservations = getReservationsForDate(state, date);
  const selected = reservations.find((reservation) => reservation.id === selectedReservationId);

  return (
    <div className="space-y-5">
      <SectionIntro eyebrow="Daily schedule" title="Daily Schedule" description="View bookings for the day at a glance." />
      <div className="rounded-lg border border-border-soft bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <AdminInput label="Schedule date" type="date" value={date} onChange={setDate} />
          <div className="flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
            <Legend color="bg-sage-light" label="Available" />
            <Legend color="bg-sky-light" label="Confirmed" />
            <Legend color="bg-butter-light" label="Pending" />
            <Legend color="bg-peach-pale" label="Unavailable" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border-soft bg-white shadow-sm">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[110px_repeat(4,1fr)] border-b border-border-soft bg-sage-pale text-sm font-bold text-ink">
            <div className="p-3">Time</div>
            {state.courts.map((court) => (
              <div key={court.id} className="border-l border-border-soft p-3 text-center">
                {court.shortName}
              </div>
            ))}
          </div>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[110px_repeat(4,1fr)] border-b border-border-soft last:border-b-0">
              <div className="bg-cream p-3 text-sm font-bold text-ink-soft">{formatHour(hour)}</div>
              {state.courts.map((court) => {
                const reservation = reservations.find(
                  (item) => item.courtId === court.id && item.startHour <= hour && hour < item.startHour + item.durationHours,
                );
                const tone = reservation
                  ? reservation.status === "booked"
                    ? "bg-butter-light text-ink"
                    : reservation.status === "cancelled" || reservation.status === "no-show"
                      ? "bg-peach-pale text-coral"
                      : "bg-sky-light text-ink"
                  : "bg-sage-pale text-ink-soft";
                return (
                  <button
                    key={`${court.id}-${hour}`}
                    className={`min-h-14 border-l border-border-soft p-3 text-center text-xs font-bold ${tone}`}
                    type="button"
                    onClick={() => setSelectedReservationId(reservation?.id ?? null)}
                  >
                    {reservation ? getReservationCustomer(state, reservation)?.name ?? reservation.id : "Available"}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {selected ? (
        <div className="rounded-lg border border-coral/30 bg-peach-pale p-4">
          <div className="text-sm font-bold text-coral">Selected booking</div>
          <div className="mt-2 font-serif text-2xl font-bold text-ink">
            {getReservationCustomer(state, selected)?.name} · {getReservationCourt(state, selected)?.name}
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {formatHour(selected.startHour)} - {formatHour(selected.startHour + selected.durationHours)} · ₱
            {selected.total.toLocaleString()}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CourtsSection({
  state,
  addPricingRule,
  updateCourtRate,
  updatePricingRulePrice,
  updateOperatingHour,
}: {
  state: BookingState;
  addPricingRule: () => void;
  updateCourtRate: (courtId: CourtId, price: number) => void;
  updatePricingRulePrice: (ruleId: string, price: number) => void;
  updateOperatingHour: (day: DayKey, patch: Partial<{ openHour: number; closeHour: number }>) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionIntro eyebrow="Court setup" title="Courts" description="Manage court inventory, operating hours, and time-based pricing rules." />
      <div className="grid gap-4 xl:grid-cols-4">
        {state.courts.map((court) => (
          <CourtCard key={court.id} court={court} updateCourtRate={updateCourtRate} />
        ))}
      </div>
      <Panel
        action={<span className="rounded-full bg-sage-pale px-3 py-1 text-xs font-bold text-ink">Company-wide schedule</span>}
        title="Operating Hours"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {dayOrder.map((day) => {
            const hours = state.operatingHours.find((item) => item.day === day);
            if (!hours) return null;
            return (
              <div key={day} className="rounded-lg border border-border-soft bg-sage-pale p-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-ink">{hours.label}</div>
                  <Pencil size={15} className="text-ink-soft" aria-hidden="true" />
                </div>
                <div className="mt-2 font-serif text-xl font-bold text-ink">
                  {formatHour(hours.openHour)} - {formatHour(hours.closeHour)}
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-full bg-white px-3 py-1 text-xs font-bold" type="button" onClick={() => updateOperatingHour(day, { openHour: Math.max(6, hours.openHour - 1) })}>
                    Open earlier
                  </button>
                  <button className="rounded-full bg-white px-3 py-1 text-xs font-bold" type="button" onClick={() => updateOperatingHour(day, { closeHour: Math.min(23, hours.closeHour + 1) })}>
                    Extend
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel
        action={
          <button className="rounded-full bg-coral px-4 py-2 text-xs font-bold uppercase text-white" type="button" onClick={addPricingRule}>
            Add Rule
          </button>
        }
        title="Pricing"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {state.pricingRules.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-border-soft bg-white p-4">
              <div className="text-sm font-bold text-ink-soft">{rule.label}</div>
              <div className="mt-1 text-sm text-ink-soft">
                {rule.day} · {formatHour(rule.startHour)} - {formatHour(rule.endHour)}
              </div>
              <PriceInput
                accent="coral"
                ariaLabel={`${rule.label} price`}
                id={`${rule.id}-price`}
                label="Rule price"
                value={rule.price}
                onChange={(price) => updatePricingRulePrice(rule.id, price)}
              />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CourtCard({ court, updateCourtRate }: { court: Court; updateCourtRate: (courtId: CourtId, price: number) => void }) {
  return (
    <article className="rounded-lg border border-border-soft bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-serif text-2xl font-bold text-ink">{court.shortName}</div>
          <div className="mt-1 text-sm text-ink-soft">
            {court.type} · {court.surface}
          </div>
        </div>
        <StatusBadge label={court.type} />
      </div>
      <PriceInput
        ariaLabel={`${court.shortName} hourly price`}
        id={`${court.id}-hourly-rate`}
        label="Hourly price"
        value={court.hourlyRate}
        onChange={(price) => updateCourtRate(court.id, price)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {court.amenities.map((amenity) => (
          <span key={amenity} className="rounded-full bg-sage-pale px-3 py-1 text-xs font-bold text-ink-mid">
            {amenity}
          </span>
        ))}
      </div>
    </article>
  );
}

function PriceInput({
  accent = "ink",
  ariaLabel,
  id,
  label,
  onChange,
  value,
}: {
  accent?: "coral" | "ink";
  ariaLabel: string;
  id: string;
  label: string;
  onChange: (price: number) => void;
  value: number;
}) {
  const inputTone = accent === "coral" ? "text-coral" : "text-ink";
  const surfaceTone = accent === "coral" ? "bg-sage-pale" : "bg-cream";

  return (
    <div className="mt-4">
      <label className="grid gap-2 text-sm font-bold text-ink" htmlFor={id}>
        {label}
      </label>
      <div className={`flex items-center gap-2 rounded-lg border border-border-soft px-3 py-2 ${surfaceTone}`}>
        <span className="font-serif text-xl font-black text-coral">₱</span>
        <input
          aria-label={ariaLabel}
          className={`min-w-0 flex-1 bg-transparent font-serif text-3xl font-black outline-none ${inputTone}`}
          id={id}
          inputMode="numeric"
          min={0}
          step={1}
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}

function ReportsSection({
  range,
  setRange,
  state,
}: {
  range: { start: string; end: string };
  setRange: (range: { start: string; end: string }) => void;
  state: BookingState;
}) {
  const summary = getAdminSummary(state, range.start, range.end);
  const revenueSeries = getRevenueSeries(state, range.start, range.end);
  const demand = getHourlyDemandAnalysis(state, range.start, range.end);
  const utilization = getCourtUtilizationRanking(state, range.start, range.end);
  const heatmap = getHourlyHeatmap(state, range.start, range.end);

  function setQuickRange(days: number) {
    const end = new Date("2026-04-30");
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    setRange({ start: toDateKey(start), end: toDateKey(end) });
  }

  return (
    <div className="space-y-5">
      <SectionIntro eyebrow="Analytics" title="Reports" description="Analytics and insights for confirmed bookings, earnings, and court demand." />
      <div className="rounded-lg border border-border-soft bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
          <AdminInput label="Start Date" type="date" value={range.start} onChange={(start) => setRange({ ...range, start })} />
          <AdminInput label="End Date" type="date" value={range.end} onChange={(end) => setRange({ ...range, end })} />
          <button className="self-end rounded-full border border-border-soft px-4 py-3 text-xs font-bold text-ink" type="button" onClick={() => setQuickRange(7)}>
            Last 7 Days
          </button>
          <button className="self-end rounded-full border border-border-soft px-4 py-3 text-xs font-bold text-ink" type="button" onClick={() => setQuickRange(30)}>
            Last 30 Days
          </button>
          <button className="self-end rounded-full bg-coral px-4 py-3 text-xs font-bold uppercase text-white" type="button" onClick={() => setRange({ start: "2026-04-01", end: "2026-04-30" })}>
            This Month
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={ReceiptText} label="Confirmed bookings" value={summary.confirmedBookings.toString()} />
        <Metric icon={Banknote} label="Total revenue" value={`₱${summary.totalRevenue.toLocaleString()}`} />
        <Metric icon={BarChart3} label="Average booking" value={`₱${summary.averageRevenuePerBooking.toLocaleString()}`} />
        <Metric icon={Clock3} label="Utilization" value={`${summary.utilization}%`} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Revenue Over Time">
          <BarGraph
            ariaLabel="Revenue bar graph"
            data={revenueSeries.map((point) => point.revenue)}
            labels={revenueSeries.map((point) => point.date.slice(5))}
            valuePrefix="₱"
          />
        </Panel>
        <Panel title="Bookings Count Over Time">
          <BarGraph
            ariaLabel="Bookings bar graph"
            data={revenueSeries.map((point) => point.bookings)}
            labels={revenueSeries.map((point) => point.date.slice(5))}
          />
        </Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel title="Hourly Demand Heatmap">
          <Heatmap cells={heatmap} />
        </Panel>
        <Panel title="Time Analysis">
          <div className="grid gap-3">
            <Insight label="Peak window" value={`${formatHour(demand.peakHour)} · ${demand.peakBookings} bookings`} />
            <Insight label="Slow window" value={`${formatHour(demand.slowHour)} · ${demand.slowBookings} bookings`} />
            <Insight label="Busiest day" value={demand.busiestDay} />
            <p className="rounded-lg bg-peach-pale p-4 text-sm font-semibold leading-6 text-ink">{demand.recommendation}</p>
            <div className="rounded-lg bg-sage-pale p-4">
              <div className="text-sm font-bold text-ink">Court ranking</div>
              {utilization.map((court) => (
                <div key={court.courtId} className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-ink">{state.courts.find((item) => item.id === court.courtId)?.shortName}</span>
                  <span className="text-ink-soft">{court.utilization}% utilized</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PrivacySection({ state, updatePrivacyStatus }: { state: BookingState; updatePrivacyStatus: (id: string) => void }) {
  return (
    <div className="space-y-5">
      <SectionIntro eyebrow="Compliance" title="Privacy Statements" description="Mock policy records used across the website, booking flow, and email touchpoints." />
      <Panel title="Policy library">
        <div className="grid gap-3">
          {state.privacyStatements.map((statement) => (
            <div key={statement.id} className="grid gap-3 rounded-lg border border-border-soft bg-cream p-4 md:grid-cols-[1fr_0.7fr_0.5fr_auto] md:items-center">
              <div>
                <div className="font-bold text-ink">{statement.title}</div>
                <div className="text-sm text-ink-soft">{statement.channel} · {statement.version}</div>
              </div>
              <div className="text-sm text-ink-soft">Updated {statement.updatedAt}</div>
              <StatusBadge label={statement.status} />
              <button className="rounded-full bg-sage-pale px-4 py-2 text-sm font-bold text-ink" type="button" onClick={() => updatePrivacyStatus(statement.id)}>
                Toggle status
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function GallerySection({ state, updateGalleryStatus }: { state: BookingState; updateGalleryStatus: (id: string) => void }) {
  return (
    <div className="space-y-5">
      <SectionIntro eyebrow="Media" title="Gallery" description="Sample media cards for courts, events, and facility highlights." />
      <div className="grid gap-4 md:grid-cols-3">
        {state.galleryItems.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-lg border border-border-soft bg-white shadow-sm">
            <div className={`grid aspect-[4/3] place-items-center bg-gradient-to-br ${galleryTone[item.accent]} text-ink`}>
              <Camera size={42} aria-hidden="true" />
            </div>
            <div className="p-4">
              <div className="font-serif text-xl font-bold text-ink">{item.title}</div>
              <div className="mt-1 text-sm text-ink-soft">{item.category} · Updated {item.updatedAt}</div>
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge label={item.status} />
                <button className="rounded-full bg-sage-pale px-4 py-2 text-sm font-bold text-ink" type="button" onClick={() => updateGalleryStatus(item.id)}>
                  Toggle
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AboutSection({ state }: { state: BookingState }) {
  return (
    <div className="space-y-5">
      <SectionIntro eyebrow="Company profile" title="About" description="Mock company metadata and recent admin activity." />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Company details">
          <div className="grid gap-4">
            <Detail label="Company" value={state.adminProfile.companyName} />
            <Detail label="Admin" value={state.adminProfile.adminName} />
            <Detail label="Email" value={state.adminProfile.adminEmail} />
            <Detail label="Role" value={state.adminProfile.role} />
          </div>
        </Panel>
        <Panel title="Recent admin activity">
          <div className="grid gap-3">
            {state.adminActivity.map((activity) => (
              <div key={activity.id} className="rounded-lg bg-sage-pale p-4">
                <div className="font-bold text-ink">{activity.label}</div>
                <div className="mt-1 text-sm text-ink-soft">{activity.detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function BillingSection({ state }: { state: BookingState }) {
  return (
    <div className="space-y-5">
      <SectionIntro eyebrow="Billing" title="Billing" description="Mock subscription, invoices, and payment method details." />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Subscription">
          <div className="grid gap-4">
            <Metric icon={ShieldCheck} label="Plan" value={state.billingSummary.plan} />
            <Detail label="Payment method" value={state.billingSummary.paymentMethod} />
            <Detail label="Next invoice" value={state.billingSummary.nextInvoiceDate} />
            <Detail label="Monthly total" value={`₱${state.billingSummary.monthlyTotal.toLocaleString()}`} />
          </div>
        </Panel>
        <Panel title="Invoices">
          <div className="grid gap-3">
            {state.billingSummary.invoices.map((invoice) => (
              <div key={invoice.id} className="grid gap-3 rounded-lg border border-border-soft bg-cream p-4 md:grid-cols-[0.7fr_1fr_0.5fr_0.5fr] md:items-center">
                <div className="font-bold text-ink">{invoice.id}</div>
                <div className="text-sm text-ink-soft">{invoice.description}</div>
                <div className="font-bold text-ink">₱{invoice.amount.toLocaleString()}</div>
                <StatusBadge label={invoice.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <div className="text-sm font-bold uppercase text-coral">{eyebrow}</div>
      <h2 className="mt-1 font-serif text-4xl font-black text-ink">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">{description}</p>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border-soft bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-serif text-2xl font-bold text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-soft bg-white p-5 shadow-sm">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-peach-pale text-coral">
        <Icon size={19} aria-hidden="true" />
      </div>
      <div className="font-serif text-3xl font-black text-ink">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase text-ink-soft">{label}</div>
    </div>
  );
}

function AdminInput({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink">
      {label}
      <input
        className="rounded-lg border border-border-soft bg-cream px-4 py-3 font-normal text-ink"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function AdminSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink">
      {label}
      <select
        className="rounded-lg border border-border-soft bg-cream px-4 py-3 font-normal text-ink"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-sage-pale px-3 py-1 text-xs font-bold uppercase text-ink-mid">
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase text-ink-soft">{label}</div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-lg bg-sage-pale p-8 text-center text-sm font-bold text-ink-soft">{text}</div>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-soft bg-cream p-4">
      <div className="text-xs font-bold uppercase text-ink-soft">{label}</div>
      <div className="mt-1 font-serif text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}

function BarGraph({
  ariaLabel,
  data,
  labels,
  valuePrefix = "",
}: {
  ariaLabel: string;
  data: number[];
  labels: string[];
  valuePrefix?: string;
}) {
  const max = Math.max(...data, 1);

  return (
    <div className="h-64 rounded-lg bg-cream p-4">
      <div
        className="grid h-48 items-end gap-2"
        role="img"
        aria-label={ariaLabel}
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      >
        {data.map((value, index) => {
          const height = value > 0 ? Math.max(10, Math.round((value / max) * 100)) : 3;
          return (
            <div key={`${labels[index]}-${value}`} className="flex h-full flex-col justify-end gap-2">
              <div
                className="rounded-t-md bg-coral shadow-sm"
                style={{ height: `${height}%` }}
                title={`${labels[index]}: ${valuePrefix}${value.toLocaleString()}`}
              />
              <div className="text-center text-[11px] font-bold text-ink">{valuePrefix}{value.toLocaleString()}</div>
            </div>
          );
        })}
      </div>
      <div
        className="mt-3 grid gap-2 text-center text-xs font-bold text-ink-soft"
        style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
      >
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function Heatmap({ cells }: { cells: ReturnType<typeof getHourlyHeatmap> }) {
  const visibleCells = cells.filter((cell) => cell.hour >= 7 && cell.hour <= 20);
  return (
    <div className="grid grid-cols-7 gap-1">
      {visibleCells.slice(0, 98).map((cell) => (
        <div
          key={`${cell.day}-${cell.hour}`}
          className="min-h-10 rounded-md border border-white/70 p-1 text-[10px] font-bold text-ink"
          style={{ backgroundColor: `rgba(232, 135, 106, ${0.12 + cell.intensity / 120})` }}
          title={`${cell.day} ${formatHour(cell.hour)}: ${cell.bookings} bookings`}
        >
          {cell.bookings}
        </div>
      ))}
    </div>
  );
}

function toDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
