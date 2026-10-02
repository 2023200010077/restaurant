export type PaymentMethod =
  | "cash"
  | "card"
  | "mobile_banking"
  | "other";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "refunded"
  | "failed";

export interface Payment {
  payment_id: number;
  order_id: number;
  payment_method: PaymentMethod;
  payment_amount: number;
  payment_date: string;
  payment_status: PaymentStatus;
  restaurant_id: number;
  restaurant_name: string;
  customer_id: number | null;
  customer_name: string | null;
}