# SmashCourt Booking Prototype

SmashCourt Booking is a prototype web booking system for a pickleball court owner. It demonstrates how customers can view court availability, reserve a pickleball court, add optional rentals or services, and how staff can manage reservations from an admin dashboard.

This project is built as a working mock application. It does not require a backend database because demo data is stored in the browser with `localStorage`.

## Features

- Customer booking page for selecting a date, court, time slot, duration, and add-ons
- Live mock availability across four pickleball courts
- Reservation form with customer contact details and skill level
- Mock payment method selection for Credit/Debit Card or GCash
- Mock payment confirmation with receipt/invoice details after a reservation is created
- Staff dashboard for bookings, schedule, courts, reports, privacy statements, gallery, about, and billing
- Admin controls for updating reservation status, payment status, court rates, pricing rules, and demo content
- Local demo persistence with a reset option
- Unit and render tests for booking logic, storage, analytics, mutations, and navigation

## Pages

- `/` - Customer-facing booking site
- `/staff` - Staff/admin dashboard

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React icons
- Vitest
- ESLint

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the app in your browser:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```

Runs the app locally for development.

```bash
npm run build
```

Builds the production version of the app.

```bash
npm run lint
```

Runs ESLint checks.

```bash
npm run typecheck
```

Runs TypeScript without emitting build files.

```bash
npm run test
```

Runs the Vitest test suite.

## Project Structure

```text
app/
  layout.tsx          Root layout and metadata
  page.tsx            Customer booking route
  staff/page.tsx      Staff dashboard route
  globals.css         Global styles and theme tokens

components/
  customer-booking-page.tsx
  staff-dashboard.tsx
  hero-carousel.tsx
  site-nav.tsx
  feature-strip.tsx

lib/
  booking-data.ts       Seed demo data
  booking-logic.ts      Availability, reservation, and status logic
  booking-storage.ts    localStorage persistence
  use-booking-store.ts  Client-side booking state hook
  admin-analytics.ts    Report calculations
  admin-mutations.ts    Admin update helpers
  booking-types.ts      Shared TypeScript types

public/
  background1.jpg
  background2.jpg
```

## Demo Data

The app starts with seeded courts, customers, reservations, add-ons, operating hours, pricing rules, and admin records. Browser changes are saved to `localStorage`, so reservations and staff edits persist on the same browser until the demo is reset.

Use the `Reset demo` button in either the booking page or staff dashboard to restore the initial mock data.

New bookings are treated as paid immediately for demo purposes. The app generates mock invoice numbers, payment references, and receipt details without connecting to a real payment provider.

## Prototype Notes

This is intended as a front-end prototype, not a production booking platform.

- No real user accounts or authentication
- No backend API or database
- No payment gateway integration
- No email or SMS notification sending
- Pricing rules are represented in the admin UI, but reservation pricing currently uses each court's hourly rate
- Operating hour management is represented in the admin UI, but customer availability currently uses the global demo open and close hours

## Current Verification Status

The project builds, lints, typechecks, and runs the Vitest test suite successfully.
