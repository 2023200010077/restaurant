export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Reservation {
  reservation_id: number;
  customer_id: number;
  customer_name: string;
  table_id: number;
  table_number: number;
  restaurant_id: number;
  restaurant_name: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  reservation_status: ReservationStatus;
}