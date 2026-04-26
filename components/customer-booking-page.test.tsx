import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildInitialBookingState } from "@/lib/booking-data";
import { ConfirmationModal, CourtAvailability } from "./customer-booking-page";

describe("CourtAvailability", () => {
  it("renders the reservation panel inside the selected court card", () => {
    const state = buildInitialBookingState();
    const html = renderToStaticMarkup(
      <CourtAvailability
        court={state.courts[1]}
        reservationPanel={<section aria-label="Selected court reservation panel">Reserve this slot</section>}
        selectedDate="2026-04-24"
        selectedSlot={{ date: "2026-04-24", courtId: "court-bandera", startHour: 6 }}
        state={state}
        onSelect={() => undefined}
      />,
    );

    expect(html).toContain("Court 2 - Bandera");
    expect(html).toContain('aria-label="Selected court reservation panel"');
    expect(html.indexOf("Court 2 - Bandera")).toBeLessThan(
      html.indexOf('aria-label="Selected court reservation panel"'),
    );
  });
});

describe("ConfirmationModal", () => {
  it("shows a confirmed reservation receipt after mock payment", () => {
    const state = buildInitialBookingState();
    const html = renderToStaticMarkup(
      <ConfirmationModal
        addOns={state.addOns}
        court={state.courts[1]}
        reservation={{
          id: "reservation-receipt-test",
          courtId: "court-bandera",
          customerId: "customer-ana",
          date: "2026-04-24",
          startHour: 6,
          durationHours: 1,
          addOnIds: ["paddle-rental"],
          paymentMethod: "gcash",
          paymentStatus: "paid",
          invoiceNumber: "INV-20260424-017",
          paymentReference: "PAY-20260424-017",
          paidAt: "2026-04-24T06:00:00.000Z",
          status: "booked",
          total: 420,
          createdAt: "2026-04-24T06:00:00.000Z",
        }}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain("Reservation confirmed");
    expect(html).toContain("Payment confirmed");
    expect(html).toContain("Invoice");
    expect(html).toContain("INV-20260424-017");
    expect(html).toContain("PAY-20260424-017");
    expect(html).toContain("GCash");
    expect(html).toContain("Paddle rental");
    expect(html).toContain("₱420");
  });
});
