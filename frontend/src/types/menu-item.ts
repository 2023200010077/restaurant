export interface MenuItem {
  item_id: number;
  category_id: number;
  category_name: string;
  item_name: string;
  description: string | null;
  price: number;
  availability: boolean | number;
  preparation_time: number;
}