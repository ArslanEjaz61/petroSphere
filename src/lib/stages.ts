export const DEAL_STAGES = [
  "lead",
  "inquiry",
  "offer",
  "loi",
  "icpo",
  "fco",
  "negotiation",
  "spa",
  "payment",
  "loading",
  "shipment",
  "delivered",
  "cancelled",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const STAGE_LABEL: Record<DealStage, string> = {
  lead: "Lead",
  inquiry: "Inquiry",
  offer: "Offer",
  loi: "LOI",
  icpo: "ICPO",
  fco: "FCO",
  negotiation: "Negotiation",
  spa: "SPA",
  payment: "Payment",
  loading: "Loading",
  shipment: "Shipment",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
