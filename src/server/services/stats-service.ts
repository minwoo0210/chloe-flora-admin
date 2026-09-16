import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { OrderStatus } from '@/lib/constants';
import type { DashboardStats } from '@/lib/types';

interface OrderStatRow {
  id: string;
  order_no: string;
  status: OrderStatus;
  total_amount: string;
  created_at: string;
  customers: { name: string | null; phone: string | null } | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const client = getSupabaseClient();

  const [
    { count: productTotal },
    { count: activeProductTotal },
    { count: customerTotal },
    { count: bannerTotal },
    { count: hotTotal },
    ordersRes,
  ] = await Promise.all([
    client.from('products').select('*', { count: 'exact', head: true }),
    client.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    client.from('customers').select('*', { count: 'exact', head: true }),
    client.from('banners').select('*', { count: 'exact', head: true }),
    client.from('hot_recommendations').select('*', { count: 'exact', head: true }),
    client
      .from('orders')
      .select('id, order_no, status, total_amount, created_at, customers(name, phone)')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (ordersRes.error) throw new Error(`查询订单失败: ${ordersRes.error.message}`);
  const allOrders = (ordersRes.data ?? []) as unknown as OrderStatRow[];

  const orderCounts: DashboardStats['orderCounts'] = {
    pending_payment: 0,
    paid: 0,
    making: 0,
    delivering: 0,
    completed: 0,
    cancelled: 0,
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  let todayRevenue = 0;
  let pendingRevenue = 0;
  for (const o of allOrders) {
    if (o.status in orderCounts) orderCounts[o.status] += 1;
    const amount = Number(o.total_amount) || 0;
    if (String(o.created_at).startsWith(todayStr) && o.status !== 'cancelled') {
      todayRevenue += amount;
    }
    if (o.status === 'paid' || o.status === 'making' || o.status === 'delivering') {
      pendingRevenue += amount;
    }
  }

  return {
    orderCounts,
    productTotal: productTotal ?? 0,
    activeProductTotal: activeProductTotal ?? 0,
    customerTotal: customerTotal ?? 0,
    bannerTotal: bannerTotal ?? 0,
    hotTotal: hotTotal ?? 0,
    todayRevenue: todayRevenue.toFixed(2),
    pendingRevenue: pendingRevenue.toFixed(2),
    recentOrders: allOrders.slice(0, 8).map((o) => ({
      id: o.id,
      order_no: o.order_no,
      status: o.status,
      total_amount: o.total_amount,
      created_at: o.created_at,
      customers: o.customers,
    })),
  };
}
