export type CourtId = "court-agave" | "court-bandera" | "court-cebu" | "court-datu";

export type ReservationStatus = "booked" | "checked-in" | "completed" | "cancelled" | "no-show";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

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
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
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

export type BookingState = {
  version: number;
  courts: Court[];
  addOns: AddOn[];
  customers: Customer[];
  reservations: Reservation[];
  closures: Closure[];
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
  note?: string;
};

export type DateAvailability = {
  totalSlots: number;
  bookedSlots: number;
  openSlots: number;
  closedSlots: number;
  status: DateAvailabilityStatus;
};
