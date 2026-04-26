export type CourtId = "court-agave" | "court-bandera" | "court-cebu" | "court-datu";

export type ReservationStatus = "booked" | "checked-in" | "completed" | "cancelled" | "no-show";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type PaymentMethod = "credit-debit-card" | "gcash";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "open-play";

export type SlotStatus = "open" | "booked" | "closed";

export type DateAvailabilityStatus = "available" | "limited" | "full" | "closed";

export type Court = {
  id: CourtId;
  name: string;
  shortName: string;
  type: "Indoor" | "Outdoor";
  surface: string;
  hourlyRate: number;
  theme: "sage" | "sky" | "peach" | "butter";
  amenities: string[];
};

export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type OperatingHour = {
  day: DayKey;
  label: string;
  openHour: number;
  closeHour: number;
  slotMinutes: number;
};

export type PricingRule = {
  id: string;
  day: DayKey;
  label: string;
  startHour: number;
  endHour: number;
  price: number;
  courtIds: CourtId[];
};

export type AddOn = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  skillLevel: SkillLevel;
};

export type Reservation = {
  id: string;
  courtId: CourtId;
  customerId: string;
  date: string;
  startHour: number;
  durationHours: number;
  addOnIds: string[];
  paymentMethod: PaymentMethod;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  invoiceNumber?: string;
  paymentReference?: string;
  paidAt?: string;
  total: number;
  createdAt: string;
  note?: string;
};

export type Closure = {
  id: string;
  date: string;
  courtIds: CourtId[];
  reason: string;
};

export type PrivacyStatement = {
  id: string;
  title: string;
  channel: "Website" | "Booking Form" | "Email";
  status: "published" | "draft" | "review";
  version: string;
  updatedAt: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  category: "Court" | "Event" | "Facility";
  status: "published" | "draft";
  accent: Court["theme"];
  updatedAt: string;
};

export type BillingInvoice = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "upcoming" | "failed";
};

export type BillingSummary = {
  plan: string;
  nextInvoiceDate: string;
  paymentMethod: string;
  monthlyTotal: number;
  invoices: BillingInvoice[];
};

export type AdminProfile = {
  companyName: string;
  adminName: string;
  adminEmail: string;
  role: string;
};

export type AdminActivity = {
  id: string;
  label: string;
  detail: string;
  createdAt: string;
};

export type BookingState = {
  version: number;
  courts: Court[];
  addOns: AddOn[];
  customers: Customer[];
  reservations: Reservation[];
  closures: Closure[];
  operatingHours: OperatingHour[];
  pricingRules: PricingRule[];
  privacyStatements: PrivacyStatement[];
  galleryItems: GalleryItem[];
  billingSummary: BillingSummary;
  adminProfile: AdminProfile;
  adminActivity: AdminActivity[];
  openHour: number;
  closeHour: number;
};

export type ReservationInput = {
  id?: string;
  courtId: CourtId;
  customer: Omit<Customer, "id">;
  date: string;
  startHour: number;
  durationHours: number;
  addOnIds: string[];
  paymentMethod: PaymentMethod;
  note?: string;
};

export type DateAvailability = {
  totalSlots: number;
  bookedSlots: number;
  openSlots: number;
  closedSlots: number;
  status: DateAvailabilityStatus;
};
