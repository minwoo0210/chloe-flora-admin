import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { resolveMediaUrl } from '@/lib/storage';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/constants';
import type {
  CustomerRow,
  CustomerWithStats,
  OrderItemRow,
  OrderRow,
  OrderWithItems,
} from '@/lib/types';

export interface OrderListQuery {
  status?: OrderStatus;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderListResult {
  items: OrderWithItems[];
  total: number;
  page: number;
  pageSize: number;
}

interface OrderRecord extends OrderRow {
  customers: CustomerRow | null;
}

/** order_items 原始行（含 main_image 列，映射后补充 image_url 与 subtotal） */
interface OrderItemDbRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price: string;
  quantity: number;
  subtotal: string | null;
  main_image: string | null;
}

async function hydrateItems(rows: OrderItemDbRow[]): Promise<OrderItemRow[]> {
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      order_id: r.order_id,
      product_id: r.product_id,
      product_name: r.product_name,
      price: r.price,
      quantity: r.quantity,
      subtotal: r.subtotal,
      main_image: r.main_image,
      image_url: r.main_image ? await resolveMediaUrl(r.main_image) : null,
    }))
  );
}

export async function listOrders(query: OrderListQuery = {}): Promise<OrderListResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 10));
  const client = getSupabaseClient();

  let dbQuery = client
    .from('orders')
    .select('*, customers(*)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (query.status) dbQuery = dbQuery.eq('status', query.status);
  if (query.keyword?.trim()) {
    const kw = `%${query.keyword.trim()}%`;
    dbQuery = dbQuery.or(`order_no.ilike.${kw},customers.name.ilike.${kw},customers.phone.ilike.${kw}`);
  }
  dbQuery = dbQuery.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await dbQuery;
  if (error) throw new Error(`查询订单失败: ${error.message}`);

  const records = (data ?? []) as OrderRecord[];
  const ids = records.map((r) => r.id);

  let itemMap = new Map<string, OrderItemRow[]>();
  if (ids.length > 0) {
    const { data: itemsData, error: itemsError } = await client
      .from('order_items')
      .select('*')
      .in('order_id', ids);
    if (itemsError) throw new Error(`查询订单明细失败: ${itemsError.message}`);
    const hydrated = await hydrateItems((itemsData ?? []) as OrderItemDbRow[]);
    itemMap = hydrated.reduce((acc, item) => {
      const list = acc.get(item.order_id) ?? [];
      list.push(item);
      acc.set(item.order_id, list);
      return acc;
    }, new Map<string, OrderItemRow[]>());
  }

  const items: OrderWithItems[] = records.map((r) => {
    const { customers, ...order } = r;
    return { ...order, customer: customers, items: itemMap.get(r.id) ?? [] };
  });

  return { items, total: count ?? 0, page, pageSize };
}

export async function getOrder(id: string): Promise<OrderWithItems | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .select('*, customers(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`查询订单失败: ${error.message}`);
  if (!data) return null;

  const record = data as OrderRecord;
  const { customers, ...order } = record;

  const { data: itemsData, error: itemsError } = await client
    .from('order_items')
    .select('*')
    .eq('order_id', id);
  if (itemsError) throw new Error(`查询订单明细失败: ${itemsError.message}`);

  const items = await hydrateItems((itemsData ?? []) as OrderItemDbRow[]);

  return { ...order, customer: customers, items };
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['making', 'cancelled'],
  making: ['delivering', 'cancelled'],
  delivering: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export async function updateOrderStatus(
  id: string,
  nextStatus: OrderStatus
): Promise<OrderRow> {
  const client = getSupabaseClient();
  const { data: current, error: findError } = await client
    .from('orders')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  if (findError) throw new Error(`查询订单失败: ${findError.message}`);
  if (!current) throw Object.assign(new Error('订单不存在'), { statusCode: 404 });

  const currentStatus = current.status as OrderStatus;
  if (currentStatus === nextStatus) {
    const { data } = await client.from('orders').select('*').eq('id', id).single();
    return data as OrderRow;
  }
  if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    throw Object.assign(new Error(
      `不允许从「${ORDER_STATUS_LABELS[currentStatus]}」变更为「${ORDER_STATUS_LABELS[nextStatus]}」`
    ), { statusCode: 409 });
  }

  const payload: Record<string, string | null> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  if (nextStatus === 'completed') payload.completed_at = new Date().toISOString();

  const { data, error } = await client
    .from('orders')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新订单状态失败: ${error.message}`);
  return data as OrderRow;
}

export async function listCustomers(keyword?: string): Promise<CustomerWithStats[]> {
  const client = getSupabaseClient();
  let query = client
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (keyword?.trim()) {
    const kw = `%${keyword.trim()}%`;
    query = query.or(`name.ilike.${kw},phone.ilike.${kw}`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`查询客户失败: ${error.message}`);
  const customers = (data ?? []) as CustomerRow[];
  if (customers.length === 0) return [];

  const { data: ordersData, error: ordersError } = await client
    .from('orders')
    .select('customer_id, created_at, total_amount, status')
    .in(
      'customer_id',
      customers.map((c) => c.id)
    );
  if (ordersError) throw new Error(`查询客户订单失败: ${ordersError.message}`);

  const stats = new Map<string, { count: number; spent: number; latest: string | null }>();
  for (const o of ordersData ?? []) {
    const s = stats.get(o.customer_id) ?? { count: 0, spent: 0, latest: null };
    s.count += 1;
    // 已取消订单不计入累计消费
    if (o.status !== 'cancelled') s.spent += Number(o.total_amount ?? 0);
    if (!s.latest || String(o.created_at) > s.latest) s.latest = String(o.created_at);
    stats.set(o.customer_id, s);
  }

  return customers.map((c) => ({
    ...c,
    order_count: stats.get(c.id)?.count ?? 0,
    total_spent: (stats.get(c.id)?.spent ?? 0).toFixed(2),
    latest_order_at: stats.get(c.id)?.latest ?? null,
  }));
}
