export interface SellerOrdersSummary {
  totalOrders: number;
  newOrders: number;
  cancelledOrders: number;
  onDeliveryOrders: number;
  deliveredOrders: number;
  totalTurnover: number;
  profitPercent?: number;
  totalProfit?: number;
}

export interface SellerDashboardSummary {
  products: {
    total: number;
    active: number;
    hidden: number;
    inventoryValue: number;
    packageLimit: number;
    remainingSlots: number;
    usagePercent: number;
  };
  orders: SellerOrdersSummary;
  sales: {
    today: number;
    yesterday: number;
    thisMonth: number;
    lastMonth: number;
    profitPercent: number;
    estimatedProfit: number;
  };
  chart: Array<{
    date: string;
    label: string;
    sales: number;
    orders: number;
  }>;
  balances: {
    walletMoney: number;
    pendingBalance: number;
    guaranteeMoney: number;
    allowWithdraw: boolean;
  };
}

export interface SellerOrder {
  id: string;
  code: string;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PICKED_UP'
    | 'SHIPPED'
    | 'ON_THE_WAY'
    | 'DELIVERED'
    | 'CANCELLED';
  amount: number;
  profitPercent: number;
  profit: number;
  productCount: number;
  createdAt: string;
  paymentMethod: string | null;
  deliveryType: string | null;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string | null;
  };
  shippingAddress: {
    street?: string;
    city: string;
    state: string;
    zip?: string;
    country: string;
    phone?: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    image: string | null;
    quantity: number;
    price: number;
    lineTotal: number;
  }>;
}

export interface SellerOrdersResponse {
  data: SellerOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function formatSellerMoney(value: number | string | undefined | null) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

export function formatSellerDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export async function sellerApiGet<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('seller_auth_token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export async function sellerApiPatch<T>(endpoint: string, body: unknown): Promise<T> {
  const token = localStorage.getItem('seller_auth_token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export async function sellerApiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const token = localStorage.getItem('seller_auth_token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `HTTP error ${response.status}`);
  }

  return data as T;
}
