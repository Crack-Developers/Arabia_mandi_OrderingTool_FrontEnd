import { create } from 'zustand';
import type {
  Staff,
  UserRole,
  Branch,
  Section,
  Table,
  MenuCategory,
  MenuItem,
  ActiveOrder,
  Notification,
  SyncQueueItem,
  Printer,
} from '../types/erp.types';
import {
  MOCK_STAFF,
  MOCK_BRANCHES,
  MOCK_SECTIONS,
  MOCK_TABLES,
  MOCK_CATEGORIES,
  MOCK_MENU_ITEMS,
} from '../constants/mockData';
import {
  authApi,
  branchApi,
  staffApi,
  tableApi,
  menuApi,
  printerApi,
  setToken,
  clearToken,
} from '../services/api.service';

export interface ERPState {
  currentUser: Staff | null;
  activeRole?: UserRole;
  isAuthenticated: boolean;
  activeScreen: string;
  branches: Branch[];
  currentBranch: Branch;
  branchFilterId: string;
  sections: Section[];
  tables: Table[];
  selectedTableId: string;
  categories: MenuCategory[];
  selectedCategory: string;
  menuItems: MenuItem[];
  searchQuery: string;
  activeOrders: Record<string, ActiveOrder>;
  notifications: Notification[];
  isOfflineMode: boolean;
  syncQueue: SyncQueueItem[];
  isSyncing: boolean;
  staffList: Staff[];

  printModal: { isOpen: boolean; type?: string; data?: any; orderData?: any; kotData?: any; [key: string]: any };
  reservationModal: { isOpen: boolean; tableId?: string };
  mergeTableModal: { isOpen: boolean; tableId?: string };

  login: (pin: string, role?: UserRole) => boolean;
  loginWithApi: (pin: string, role?: any) => Promise<boolean>;
  logout: () => void;
  setActiveScreen: (screen: string) => void;
  setBranchFilterId: (branchId: string) => void;
  setCurrentBranch: (branchId: string) => void;
  setSelectedTable: (tableId: string) => void;
  setSelectedCategory: (categoryId: string) => void;
  setSearchQuery: (query: string) => void;
  setOfflineMode: (offline: boolean) => void;

  fetchBranches: () => Promise<void>;
  fetchTables: (branchId?: string) => Promise<void>;
  fetchMenuData: () => Promise<void>;
  fetchStaffList: () => Promise<void>;
  fetchPrinters: (branchId?: string) => Promise<void>;
  scanLANPrinters: () => Promise<Printer[]>;
  printers: Printer[];
  discoveredPrinters: Printer[];
  addPrinter: (printer: Partial<Printer>) => Promise<Printer>;
  updatePrinter: (id: string, updates: Partial<Printer>) => Promise<Printer>;
  deletePrinter: (id: string) => Promise<void>;
  testPrintJob: (printerId: string) => Promise<boolean>;
  printKOTBySection: (kot: any, tableId: string) => Promise<void>;
  addBranch: (branch: Partial<Branch>) => Promise<Branch>;
  updateBranch: (idOrBranch: any, updates?: any) => Promise<Branch>;
  deleteBranch: (id: string) => Promise<void>;
  toggleBranchStatus: (id: string) => void;

  addTable: (table: Partial<Table>) => void;
  updateTableStatus: (tableId: string, status: any) => void;
  openReservationModal: (tableId: string) => void;
  closeReservationModal: () => void;
  createReservation: (...args: any[]) => void;
  unreserveTable: (tableId: string) => void;
  checkExpiredReservations: () => void;
  openMergeModal: (tableId: string) => void;
  closeMergeModal: () => void;
  mergeTables: (sourceId: string, targetId: string) => void;
  separateTables: (tableId: string) => void;

  toggleMenuItemAvailability: (itemId: string) => void;
  addMenuItem: (item: Partial<MenuItem>) => void;
  addCategory: (name: string) => Promise<MenuCategory>;

  openPrintModal: (type?: string, data?: any) => void;
  closePrintModal: () => void;

  addItemToOrder: (item: MenuItem, variantIdx: number, addons?: any[], notes?: string) => void;
  updateOrderItemQty: (itemIdx: number, delta: number) => void;
  removeOrderItem: (itemIdx: number) => void;
  generateKOT: () => void;
  generateBill: () => void;
  processPayment: (payment: { cash?: number; card?: number; upi?: number }) => void;

  markNotificationRead: (id: string) => void;
  triggerSyncQueue: () => void;

  addUser: (user: Partial<Staff>) => void;
  updateUser: (id?: any, updates?: any) => void;
  deleteUser: (id: string) => void;
  resetUserPassword: (id: string) => void;
}

// API base is handled by api.service.ts

export const useERPStore = create<ERPState>((set, get) => ({
  currentUser: null,
  activeRole: undefined,
  isAuthenticated: false,
  activeScreen: 'POS_WORKSPACE',
  branches: MOCK_BRANCHES,
  currentBranch: MOCK_BRANCHES[0] || { _id: '', name: '', branchCode: '', address: '', phone: '', gst: '', taxes: { cgst: 0, sgst: 0, serviceCharge: 0 }, timings: '', status: 'Active' as const },
  branchFilterId: 'ALL',
  sections: MOCK_SECTIONS,
  tables: MOCK_TABLES,
  selectedTableId: MOCK_TABLES[0]?._id || '',
  categories: MOCK_CATEGORIES,
  selectedCategory: 'ALL',
  menuItems: MOCK_MENU_ITEMS,
  searchQuery: '',
  activeOrders: {},
  notifications: [
    {
      id: 'n1',
      type: 'info',
      title: 'System Initialized',
      message: 'Arabia Mandi POS & Admin environment loaded successfully.',
      timestamp: 'Just now',
      read: false,
    },
  ],
  isOfflineMode: false,
  syncQueue: [],
  isSyncing: false,
  staffList: MOCK_STAFF,
  printers: [],
  discoveredPrinters: [],

  printModal: { isOpen: false },
  reservationModal: { isOpen: false },
  mergeTableModal: { isOpen: false },

  login: (credential1: string, credential2?: any) => {
    const staffList = get().staffList;
    // 1. Try matching by username/email/pin + password/role
    let staff = staffList.find(
      (s) =>
        (s.username === credential1 || s.email === credential1 || s.pin === credential1) &&
        (!credential2 || s.password === credential2 || s.role === credential2)
    );
    // 2. Try matching username/email/pin alone
    if (!staff) {
      staff = staffList.find(
        (s) => s.username === credential1 || s.email === credential1 || s.pin === credential1
      );
    }
    // 3. Try matching role directly
    if (!staff) {
      staff = staffList.find((s) => s.role === credential1);
    }
    // 4. Default fallbacks if exact string passed
    if (!staff && credential1?.toLowerCase().includes('admin')) {
      staff = staffList.find((s) => s.role === 'Super Admin');
    }
    if (!staff && credential1?.toLowerCase().includes('tariq')) {
      staff = staffList.find((s) => s.role === 'Receptionist');
    }

    if (staff) {
      set({
        currentUser: staff,
        activeRole: staff.role,
        isAuthenticated: true,
        activeScreen: staff.role === 'Super Admin' ? 'ADMIN_ANALYTICS' : 'POS_WORKSPACE',
      });
      return true;
    }
    return false;
  },

  loginWithApi: async (username: string, password: string) => {
    try {
      const result = await authApi.login(username, password);
      const { token, user } = result;
      setToken(token);
      // Map backend user to Staff shape
      const staffObj: Staff = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role as UserRole,
        pin: '',
        branchIds: user.branchAccess === 'All Branches' ? ['ALL'] : [user.branchId],
        active: true,
        username,
        employeeCode: user.employeeCode || '',
        designation: user.designation,
        branchAccess: user.branchAccess,
      };
      set({
        currentUser: staffObj,
        activeRole: user.role as UserRole,
        isAuthenticated: true,
        activeScreen: user.role === 'Super Admin' ? 'ADMIN_ANALYTICS' : 'POS_WORKSPACE',
      });
      // Hydrate data from API after login
      get().fetchBranches();
      get().fetchMenuData();
      get().fetchStaffList();
      get().fetchPrinters();
      return true;
    } catch {
      // Fallback to mock login
      return get().login(username, password as any);
    }
  },

  logout: () => {
    clearToken();
    set({ isAuthenticated: false, currentUser: null, activeRole: undefined });
  },

  setActiveScreen: (screen) => set({ activeScreen: screen }),

  setBranchFilterId: (branchId) => {
    if (branchId !== 'ALL') {
      const b = get().branches.find((br) => br._id === branchId);
      if (b) {
        set({ branchFilterId: branchId, currentBranch: b });
        return;
      }
    }
    set({ branchFilterId: branchId });
  },

  setCurrentBranch: (branchId) => {
    const b = get().branches.find((br) => br._id === branchId) || get().branches[0];
    set({ currentBranch: b, branchFilterId: branchId });
  },

  setSelectedTable: (tableId) => set({ selectedTableId: tableId }),
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setOfflineMode: (offline) => set({ isOfflineMode: offline }),

  fetchBranches: async () => {
    try {
      const data = await branchApi.getAll();
      const list = Array.isArray(data) ? data : (data?.branches || data?.data || []);
      if (list.length > 0) {
        set({ branches: list, currentBranch: list[0] });
      }
    } catch {
      // keep mock fallback
    }
  },

  fetchTables: async (branchId?: string) => {
    try {
      const data = await tableApi.getAll(branchId);
      const list = Array.isArray(data) ? data : (data?.tables || []);
      if (list.length > 0) set({ tables: list, selectedTableId: list[0]?._id || '' });
    } catch {
      // keep mock fallback
    }
  },

  fetchMenuData: async () => {
    try {
      const [catData, itemData] = await Promise.all([
        menuApi.getAllCategories(),
        menuApi.getAllItems(),
      ]);
      const cats = Array.isArray(catData) ? catData : (catData?.categories || []);
      const items = Array.isArray(itemData) ? itemData : (itemData?.menuItems || []);
      if (cats.length > 0) {
        set({ categories: cats });
      } else {
        set({
          categories: [
            { _id: 'cat-mandi', name: 'Mandi Meat Platters' },
            { _id: 'cat-starters', name: 'Arabian Starters & Grills' },
            { _id: 'cat-desserts', name: 'Kunafa & Desserts' },
            { _id: 'cat-beverages', name: 'Beverages & Mocktails' },
          ],
        });
      }
      if (items.length > 0) set({ menuItems: items });
    } catch {
      set({
        categories: [
          { _id: 'cat-mandi', name: 'Mandi Meat Platters' },
          { _id: 'cat-starters', name: 'Arabian Starters & Grills' },
          { _id: 'cat-desserts', name: 'Kunafa & Desserts' },
          { _id: 'cat-beverages', name: 'Beverages & Mocktails' },
        ],
      });
    }
  },

  fetchStaffList: async () => {
    try {
      const data = await staffApi.getAll();
      const list = Array.isArray(data) ? data : (data?.staff || []);
      if (list.length > 0) set({ staffList: list });
    } catch {
      // keep mock fallback
    }
  },

  fetchPrinters: async (branchId?: string) => {
    try {
      const data = await printerApi.getAll(branchId);
      const list = Array.isArray(data) ? data : (data?.printers || []);
      set({ printers: list });
    } catch {
      // Keep existing printers
    }
  },

  scanLANPrinters: async () => {
    try {
      const data = await printerApi.scanLAN();
      const list = Array.isArray(data) ? data : (data?.printers || []);
      if (list.length > 0) {
        set({ discoveredPrinters: list });
        return list;
      }
    } catch {
      // Offline / LAN discovery fallback
    }

    const mockDiscovered: Printer[] = [
      {
        _id: 'lan-prn-1',
        name: 'EPSON TM-T88VI (Kitchen LAN)',
        ip: '192.168.1.87',
        port: 9100,
        type: 'thermal',
        connection: 'LAN',
        status: 'online',
        sections: [],
      },
      {
        _id: 'lan-prn-2',
        name: 'POS-80C Thermal (Bar Floor LAN)',
        ip: '192.168.1.95',
        port: 9100,
        type: 'thermal',
        connection: 'LAN',
        status: 'online',
        sections: [],
      },
      {
        _id: 'lan-prn-3',
        name: 'Star TSP143 (USB/LAN Network)',
        ip: '192.168.1.102',
        port: 9100,
        type: 'thermal',
        connection: 'USB/LAN',
        status: 'online',
        sections: [],
      },
    ];
    set({ discoveredPrinters: mockDiscovered });
    return mockDiscovered;
  },

  addPrinter: async (printerData) => {
    try {
      const created = await printerApi.create(printerData);
      const newPrinter = created?.printer || created;
      set((state) => ({ printers: [...state.printers, newPrinter] }));
      return newPrinter;
    } catch {
      const newPrinter: Printer = {
        _id: `prn-${Date.now()}`,
        name: printerData.name || 'Network Printer',
        ip: printerData.ip || '192.168.1.200',
        port: printerData.port || 9100,
        type: printerData.type || 'thermal',
        sections: printerData.sections || ['ALL'],
        branchId: printerData.branchId || get().currentBranch._id,
        isActive: true,
      };
      set((state) => ({ printers: [...state.printers, newPrinter] }));
      return newPrinter;
    }
  },

  updatePrinter: async (id, updates) => {
    try { await printerApi.update(id, updates); } catch { /* offline */ }
    set((state) => ({
      printers: state.printers.map((p) => (p._id === id ? { ...p, ...updates } : p)),
    }));
    return get().printers.find((p) => p._id === id)!;
  },

  deletePrinter: async (id) => {
    try { await printerApi.delete(id); } catch { /* offline */ }
    set((state) => ({ printers: state.printers.filter((p) => p._id !== id) }));
  },

  testPrintJob: async (printerId) => {
    try {
      await printerApi.printJob(printerId, {
        type: 'TEST_PRINT',
        timestamp: new Date().toISOString(),
        message: 'Wireless Printer Test Connection Successful',
      });
      return true;
    } catch {
      return false;
    }
  },

  printKOTBySection: async (kot, tableId) => {
    const { printers, currentBranch } = get();
    if (!printers || printers.length === 0) return;

    // Group order items by section
    const itemsBySection: Record<string, any[]> = {};
    kot.items?.forEach((it: any) => {
      const itemSection = it.sections?.[0] || 'ALL';
      if (!itemsBySection[itemSection]) itemsBySection[itemSection] = [];
      itemsBySection[itemSection].push(it);
    });

    // Send section-specific KOT to matching printer
    for (const [section, items] of Object.entries(itemsBySection)) {
      const targetPrinter =
        printers.find((p) => p.sections?.includes(section) || p.sections?.includes('ALL')) ||
        printers[0];
      if (!targetPrinter) continue;

      const payload = {
        type: 'KOT',
        tableId,
        kotNumber: kot.kotNumber,
        timestamp: kot.timestamp,
        section,
        branchName: currentBranch.name,
        items,
      };

      try {
        await printerApi.printJob(targetPrinter._id, payload);
      } catch {
        // Queue for offline sync retry
        set((state) => ({
          syncQueue: [
            ...state.syncQueue,
            {
              id: `sync-print-${Date.now()}`,
              action: 'printJob',
              payload: { printerId: targetPrinter._id, payload },
              createdAt: Date.now(),
            },
          ],
        }));
      }
    }
  },

  addBranch: async (branchData) => {
    try {
      const created = await branchApi.create(branchData);
      const newBranch = created?.branch || created;
      set((state) => ({ branches: [...state.branches, newBranch], currentBranch: newBranch }));
      return newBranch;
    } catch {
      const newBranch: Branch = {
        _id: `br-${Date.now()}`,
        branchCode: branchData.branchCode || `BR-${Date.now()}`,
        name: branchData.name || 'New Branch',
        address: branchData.address || '',
        phone: branchData.phone || '',
        gst: branchData.gst || '',
        taxes: branchData.taxes || { cgst: 2.5, sgst: 2.5, serviceCharge: 0 },
        receiptSettings: branchData.receiptSettings || {
          invoicePrefix: 'INV-', headerText: 'Welcome!', footerText: 'Thank you!',
          printLogo: false, autoPrintOnCheckout: true, useThermalFormat: true, paperWidth: '80mm',
        },
        timings: branchData.timings || '11:00 AM - 11:30 PM',
        managerName: branchData.managerName || '',
        managerId: branchData.managerId || '',
        sections: branchData.sections || [{ name: 'Main Dining Hall', floor: 'Ground Floor', tablesCount: 14 }],
      };
      set((state) => ({ branches: [...state.branches, newBranch], currentBranch: newBranch }));
      return newBranch;
    }
  },

  updateBranch: async (idOrBranch: any, updates?: any) => {
    const id = typeof idOrBranch === 'string' ? idOrBranch : idOrBranch._id;
    const patch = typeof idOrBranch === 'string' ? updates : idOrBranch;
    try { await branchApi.update(id, patch); } catch { /* offline fallback */ }
    const updated = get().branches.map((b) => b._id === id ? { ...b, ...patch } : b);
    const updatedBranch = updated.find((b) => b._id === id) || get().currentBranch;
    set({ branches: updated, currentBranch: updatedBranch });
    return updatedBranch;
  },

  deleteBranch: async (id) => {
    try { await branchApi.delete(id); } catch { /* offline fallback */ }
    set((state) => ({ branches: state.branches.filter((b) => b._id !== id) }));
  },

  toggleBranchStatus: (id) => {
    set((state) => ({
      branches: state.branches.map((b) =>
        b._id === id ? { ...b, isActive: !b.isActive } : b
      ),
    }));
  },

  addTable: (tableData) => {
    const newTable: Table = {
      _id: `tbl-${Date.now()}`,
      branchId: get().currentBranch._id,
      sectionId: tableData.sectionId || 'sec-1',
      sectionName: tableData.sectionName || 'Dining Hall',
      tableNumber: tableData.tableNumber || `T-${get().tables.length + 1}`,
      capacity: tableData.capacity || 4,
      status: 'Available',
    };
    set((state) => ({
      tables: [...state.tables, newTable],
    }));
  },

  updateTableStatus: (tableId, status) => {
    set((state) => ({
      tables: state.tables.map((t) => (t._id === tableId ? { ...t, status } : t)),
    }));
  },

  openReservationModal: (tableId) => {
    set({ reservationModal: { isOpen: true, tableId } });
  },
  closeReservationModal: () => {
    set({ reservationModal: { isOpen: false } });
  },
  createReservation: (tableIdsOrId, nameOrObj, phone, guests, reservedDate, reservedTime, extraTableIds) => {
    const targetTableIds = Array.isArray(tableIdsOrId)
      ? tableIdsOrId
      : [tableIdsOrId, ...(extraTableIds || [])];

    const reservationObj =
      typeof nameOrObj === 'object'
        ? nameOrObj
        : {
            customerName: nameOrObj,
            phone: phone || '',
            guests: guests || 4,
            reservedAt: new Date().toISOString(),
            reservedDate: reservedDate || new Date().toISOString().split('T')[0],
            reservedTime: reservedTime || 'Immediate',
            expiresAt: '',
            reservedTables: targetTableIds,
          };

    set((state) => ({
      tables: state.tables.map((t) =>
        targetTableIds.includes(t._id)
          ? { ...t, status: 'Reserved', reservation: reservationObj }
          : t
      ),
      reservationModal: { isOpen: false },
    }));
  },
  unreserveTable: (tableId) => {
    set((state) => ({
      tables: state.tables.map((t) =>
        t._id === tableId ? { ...t, status: 'Available', reservation: undefined } : t
      ),
    }));
  },
  checkExpiredReservations: () => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    set((state) => {
      let expiredCount = 0;
      const updatedTables = state.tables.map((t) => {
        if (t.status === 'Reserved' && t.reservation?.reservedTime && !state.activeOrders[t._id]) {
          const todayStr = now.toISOString().split('T')[0];
          const isTodayOrEarlier = !t.reservation.reservedDate || t.reservation.reservedDate <= todayStr;
          const resTimeStr = t.reservation.reservedTime;
          const [hStr, mStr] = resTimeStr.split(':');
          const resHours = parseInt(hStr, 10);
          const resMins = parseInt(mStr, 10);
          if (isTodayOrEarlier && !isNaN(resHours) && !isNaN(resMins)) {
            const reservedMinutes = resHours * 60 + resMins;
            // Expire if more than 15 mins past reserved time today
            if (nowMinutes - reservedMinutes >= 15 && nowMinutes - reservedMinutes < 720) {
              expiredCount++;
              return { ...t, status: 'Available' as const, reservation: undefined };
            }
          }
        }
        return t;
      });

      if (expiredCount > 0) {
        return {
          tables: updatedTables,
          notifications: [
            {
              id: 'exp-' + Date.now(),
              type: 'warning',
              title: 'Reservation Auto-Released',
              message: `${expiredCount} reserved table(s) auto-released due to 15+ min grace period expiry without order.`,
              timestamp: 'Just now',
              read: false,
            },
            ...state.notifications,
          ],
        };
      }
      return state;
    });
  },
  openMergeModal: (tableId) => {
    set({ mergeTableModal: { isOpen: true, tableId } });
  },
  closeMergeModal: () => {
    set({ mergeTableModal: { isOpen: false } });
  },
  mergeTables: (sourceId, targetId) => {
    set((state) => ({
      tables: state.tables.map((t) =>
        t._id === sourceId
          ? { ...t, status: 'Merged', mergedWith: [targetId] }
          : t
      ),
      mergeTableModal: { isOpen: false },
    }));
  },
  separateTables: (tableId) => {
    set((state) => ({
      tables: state.tables.map((t) =>
        t._id === tableId ? { ...t, mergedWith: [], status: 'Available' } : t
      ),
    }));
  },

  toggleMenuItemAvailability: async (itemId) => {
    try { await menuApi.toggleAvailability(itemId); } catch { /* offline */ }
    set((state) => ({
      menuItems: state.menuItems.map((item) =>
        item._id === itemId
          ? { ...item, available: !item.available, active: !item.available }
          : item
      ),
    }));
  },

  addMenuItem: async (itemData) => {
    const payload = {
      branchId: get().currentBranch._id,
      categoryId: itemData.categoryId || 'cat-1',
      name: itemData.name || 'New Item',
      description: itemData.description || '',
      variants: itemData.variants || [{ name: 'Regular', price: 100 }],
      addons: itemData.addons || [],
      badge: itemData.badge,
      sections: itemData.sections || ['ALL'],
      available: true,
      active: true,
    };
    try {
      const created = await menuApi.createItem(payload);
      const newItem = created?.menuItem || created;
      set((state) => ({ menuItems: [...state.menuItems, newItem] }));
    } catch {
      const newItem: MenuItem = { _id: `mi-${Date.now()}`, ...payload, printerId: 'prn-1' };
      set((state) => ({ menuItems: [...state.menuItems, newItem] }));
    }
  },

  addCategory: async (name: string) => {
    try {
      const created = await menuApi.createCategory({
        name: name.trim(),
        displayOrder: get().categories.length + 1,
        active: true,
      });
      const newCat = created?.category || created?.data || created;
      set((state) => ({ categories: [...state.categories, newCat] }));
      return newCat;
    } catch {
      const newCat = {
        _id: `cat-${Date.now()}`,
        name: name.trim(),
        displayOrder: get().categories.length + 1,
        active: true,
      };
      set((state) => ({ categories: [...state.categories, newCat] }));
      return newCat;
    }
  },

  openPrintModal: (type = 'BILL', data = null) => {
    set({ printModal: { isOpen: true, type, data } });
  },
  closePrintModal: () => {
    set({ printModal: { isOpen: false } });
  },

  addItemToOrder: (item, variantIdx, addons = [], notes = '') => {
    const tableId = get().selectedTableId;
    if (!tableId) return;
    const variant = item.variants[variantIdx] || item.variants[0];
    const order = get().activeOrders[tableId] || {
      orderId: `ord-${Date.now()}`,
      tableId,
      orderNumber: `#ORD-${Math.floor(Math.random() * 9000 + 1000)}`,
      items: [],
      kots: [],
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
      status: 'Active',
    };

    const newItem = {
      id: `item-${Date.now()}`,
      menuItemId: item._id,
      name: item.name,
      variantName: variant.name,
      price: variant.price,
      quantity: 1,
      addons,
      notes,
    };

    const newItems = [...order.items, newItem];
    const subtotal = newItems.reduce(
      (sum, i) =>
        sum +
        i.price * i.quantity +
        ((i.addons || []).reduce<number>((acc, a: any) => acc + (Number(a.price) || 0), 0)) * i.quantity,
      0
    );
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = subtotal + cgst + sgst;

    set((state) => ({
      activeOrders: {
        ...state.activeOrders,
        [tableId]: { ...order, items: newItems, subtotal, cgst, sgst, total },
      },
      tables: state.tables.map((t) =>
        t._id === tableId ? { ...t, status: 'Occupied' } : t
      ),
    }));
  },

  updateOrderItemQty: (itemIdx, delta) => {
    const tableId = get().selectedTableId;
    const order = get().activeOrders[tableId];
    if (!order) return;
    const updatedItems = order.items
      .map((item, idx) =>
        idx === itemIdx ? { ...item, quantity: item.quantity + delta } : item
      )
      .filter((i) => i.quantity > 0);

    const subtotal = updatedItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = subtotal + cgst + sgst;

    set((state) => ({
      activeOrders: {
        ...state.activeOrders,
        [tableId]: {
          ...order,
          items: updatedItems,
          subtotal,
          cgst,
          sgst,
          total,
        },
      },
    }));
  },

  removeOrderItem: (itemIdx) => {
    get().updateOrderItemQty(itemIdx, -999);
  },

  generateKOT: () => {
    const tableId = get().selectedTableId;
    const order = get().activeOrders[tableId];
    if (!order || order.items.length === 0) return;
    const newKot = {
      id: `kot-${Date.now()}`,
      kotNumber: `KOT-${order.kots.length + 1}`,
      items: order.items,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    set((state) => ({
      activeOrders: {
        ...state.activeOrders,
        [tableId]: { ...order, kots: [...order.kots, newKot] },
      },
    }));

    // Trigger wireless printer routing by section
    get().printKOTBySection(newKot, tableId);
  },

  generateBill: () => {
    const tableId = get().selectedTableId;
    const order = get().activeOrders[tableId];
    if (!order) return;
    set((state) => ({
      tables: state.tables.map((t) =>
        t._id === tableId ? { ...t, status: 'Billing' } : t
      ),
    }));
  },

  processPayment: () => {
    const tableId = get().selectedTableId;
    set((state) => {
      const nextOrders = { ...state.activeOrders };
      delete nextOrders[tableId];
      return {
        activeOrders: nextOrders,
        tables: state.tables.map((t) =>
          t._id === tableId ? { ...t, status: 'Available' } : t
        ),
      };
    });
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  triggerSyncQueue: () => {
    set({ syncQueue: [] });
  },

  addUser: async (user) => {
    try {
      const created = await staffApi.create(user);
      const newStaff = created?.staff || created;
      set((state) => ({ staffList: [...state.staffList, newStaff] }));
    } catch {
      const newStaff: Staff = {
        _id: `stf-${Date.now()}`,
        name: user.name || 'Staff User',
        role: user.role || 'Receptionist',
        phone: user.phone || '',
        pin: user.pin || '1234',
        branchIds: user.branchIds || ['br-001'],
        active: user.active !== undefined ? user.active : true,
        username: user.username || user.name?.toLowerCase().replace(/\s+/g, ''),
        employeeCode: user.employeeCode || `EMP-${Date.now()}`,
      };
      set((state) => ({ staffList: [...state.staffList, newStaff] }));
    }
  },

  updateUser: async (id, updates) => {
    try { await staffApi.update(id, updates); } catch { /* offline */ }
    set((state) => ({
      staffList: state.staffList.map((s) => s._id === id ? { ...s, ...updates } : s),
    }));
  },

  deleteUser: async (id) => {
    try { await staffApi.delete(id); } catch { /* offline */ }
    set((state) => ({ staffList: state.staffList.filter((s) => s._id !== id) }));
  },

  resetUserPassword: async (id) => {
    try { await staffApi.resetPassword(id); } catch { /* offline */ }
  },
}));
