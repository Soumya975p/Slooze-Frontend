export type UserRole = 'MANAGER' | 'STORE_KEEPER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthPayload {
  access_token: string;
  user: User;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  discount?: number;
  purchase?: number;
  createdAt: string;
}

export interface RecentSale {
  name: string;
  email: string;
  amount: number;
}

export interface MonthlyStat {
  month: string;
  value: number;
}

export interface WeeklyStat {
  day: string;
  revenue: number;
  expenses: number;
}

export interface DashboardStats {
  totalEarnings: number;
  totalSales: number;
  totalRevenue: number;
  subscriptions: number;
  recentSales: RecentSale[];
  monthlySalesData: MonthlyStat[];
  weeklyOverviewData: WeeklyStat[];
}
