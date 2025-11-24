export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'paid';

export type MenuCategory = 'appetizers' | 'soups' | 'salads' | 'kebabs' | 'rice-dishes' | 'stews' | 'seafood' | 'breads' | 'desserts' | 'drinks' | 'shisha' | 'hot-drinks';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'needs-cleaning';

export interface MenuItem {
  id: string;
  name: string;
  nameKurdish: string;
  nameArabic: string;
  category: MenuCategory;
  price: number;
  cost?: number;
  description: string;
  descriptionKurdish: string;
  descriptionArabic: string;
  image?: string;
  available: boolean;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  waiterName?: string;
  total: number;
  splitInfo?: {
    totalPeople: number;
    amountPerPerson: number;
  };
}

export interface Table {
  number: number;
  status: TableStatus;
  capacity: number;
  currentOrderId?: string;
  reservedFor?: string;
  lastCleaned?: Date;
}

export interface StaffActivity {
  id: string;
  staffName: string;
  action: string;
  timestamp: Date;
  details?: string;
}

export type NotificationType = 'assist' | 'notify';

export interface TableNotification {
  id: number;
  tableNumber: number;
  type: NotificationType;
  createdAt: string;
}
