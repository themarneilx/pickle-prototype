import type { BookingState, CourtId } from "./booking-types";

function normalizePrice(price: number) {
  return Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0;
}

export function setCourtHourlyRate(state: BookingState, courtId: CourtId, price: number): BookingState {
  const normalizedPrice = normalizePrice(price);

  return {
    ...state,
    courts: state.courts.map((court) =>
      court.id === courtId ? { ...court, hourlyRate: normalizedPrice } : court,
    ),
  };
}

export function setPricingRulePrice(state: BookingState, ruleId: string, price: number): BookingState {
  const normalizedPrice = normalizePrice(price);

  return {
    ...state,
    pricingRules: state.pricingRules.map((rule) =>
      rule.id === ruleId ? { ...rule, price: normalizedPrice } : rule,
    ),
  };
}
