import type { Branch, Section, Table, MenuCategory, MenuItem, Staff } from '../types/erp.types';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — Minimal fallback used ONLY when the API is unreachable.
// All real data comes from MongoDB via the Express API.
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_BRANCHES: Branch[] = [];

export const MOCK_SECTIONS: Section[] = [];

export const MOCK_TABLES: Table[] = [];

export const MOCK_CATEGORIES: MenuCategory[] = [];

export const MOCK_MENU_ITEMS: MenuItem[] = [];

export const MOCK_STAFF: Staff[] = [
  {
    _id: 'local-admin',
    employeeCode: 'EMP-001',
    name: 'Admin',
    email: 'admin@pos.local',
    phone: '',
    role: 'Super Admin',
    branchId: '',
    active: true,
    username: 'admin',
    password: 'Password@123',
  },
];
