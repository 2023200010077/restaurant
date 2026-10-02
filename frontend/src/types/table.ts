export type TableStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "maintenance";

export interface RestaurantTable {
  table_id: number;
  restaurant_id: number;
  restaurant_name: string;
  table_number: number;
  capacity: number;
  table_status: TableStatus;
}