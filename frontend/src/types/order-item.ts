export interface OrderItem {
  order_item_id: number;
  order_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  item_name: string;
  restaurant_id: number;
  restaurant_name: string;
}