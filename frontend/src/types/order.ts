
export type OrderType = "dine_in" | "takeaway" | "delivery";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface Order {
  order_id: number;
  customer_id: number | null;
  customer_name: string | null;
  restaurant_id: number;
  restaurant_name: string;
  table_id: number | null;
  table_number: number | null;
  employee_id: number | null;
  employee_name: string | null;
  order_date: string;
  order_time: string;
  order_type: OrderType;
  order_status: OrderStatus;
  total_amount: number;
}