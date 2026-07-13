export type UserRole = 'Super Admin' | 'Receptionist' | 'Manager' | 'Kitchen' | 'Waiter' | 'Cashier' | 'Admin';

export interface Staff {
  _id: string;
  name: string;
  role: UserRole;
  phone: string;
  pin?: string;
  branchIds?: string[];
  branchId?: string;
  active: boolean;
  code?: string;
  username?: string;
  employeeCode?: string;
  email?: string;
  [key: string]: any;
}

export interface BranchSection {
  _id?: string;
  name: string;
  floor: string;
  tablesCount?: number;
  description?: string;
  [key: string]: any;
}

export interface Branch {
  _id: string;
  branchCode: string;
  name: string;
  address: string;
  phone: string;
  gst?: string;
  taxes?: {
    cgst: number;
    sgst: number;
    serviceCharge: number;
    [key: string]: any;
  };
  receiptSettings?: {
    invoicePrefix: string;
    headerText: string;
    footerText: string;
    printLogo: boolean;
    autoPrintOnCheckout: boolean;
    useThermalFormat: boolean;
    paperWidth: string;
  };
  timings?: string;
  managerName?: string;
  managerId?: string;
  sections?: BranchSection[];
  [key: string]: any;
}

export interface Section {
  _id: string;
  branchId: string;
  name: string;
  floor?: string;
  printerId?: string;
  [key: string]: any;
}

export interface TableReservation {
  id?: string;
  customerName: string;
  phone: string;
  guests: number;
  reservedAt: string;
  expiresAt: string;
  reservedDate?: string;
  reservedTime?: string;
  reservedTables?: string[];
  [key: string]: any;
}

export interface Table {
  _id: string;
  branchId: string;
  sectionId: string;
  sectionName?: string;
  tableNumber: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Billing' | 'Merged';
  mergedWith?: string[];
  reservation?: TableReservation;
  occupiedSince?: string;
  [key: string]: any;
}

export interface MenuCategory {
  _id: string;
  branchId?: string;
  name: string;
  printerId?: string;
  sortOrder?: number;
  displayOrder?: number;
  active?: boolean;
  [key: string]: any;
}

export interface MenuItemVariant {
  name: string;
  price: number;
}

export interface MenuItemAddon {
  name: string;
  price: number;
}

export interface MenuItem {
  _id: string;
  branchId?: string;
  categoryId: string;
  name: string;
  description: string;
  variants: MenuItemVariant[];
  addons: MenuItemAddon[];
  printerId?: string;
  badge?: string;
  available: boolean;
  active?: boolean;
  taxRate?: number;
  sections?: string[];
  [key: string]: any;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  variantName: string;
  price: number;
  quantity: number;
  addons: MenuItemAddon[];
  notes?: string;
  status?: string;
  [key: string]: any;
}

export interface KOT {
  id: string;
  kotNumber: string;
  items: OrderItem[];
  timestamp: string;
  [key: string]: any;
}

export interface ActiveOrder {
  orderId: string;
  tableId: string;
  orderNumber: string;
  items: OrderItem[];
  kots: KOT[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  status: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SyncQueueItem {
  id: string;
  action: string;
  payload: any;
  createdAt: number;
  [key: string]: any;
}

export interface Bill {
  id?: string;
  billNumber?: string;
  orderNumber?: string;
  items?: OrderItem[];
  subtotal?: number;
  cgst?: number;
  sgst?: number;
  total?: number;
  timestamp?: string;
  [key: string]: any;
}

export interface Printer {
  _id: string;
  name: string;
  ip: string;
  port?: number;
  type: 'thermal' | 'ipp' | 'pdf';
  duty?: 'KOT' | 'RECEIPT' | 'BOTH';
  floor?: string;
  sections: string[];
  branchId?: string;
  isActive?: boolean;
  status?: 'online' | 'offline' | 'ready';
  connection?: 'LAN' | 'USB/LAN' | 'WIFI';
  [key: string]: any;
}


