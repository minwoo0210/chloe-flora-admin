/**
 * 通过 Supabase service role 写入订单/客户种子（与应用同一数据通道，确保持久化）。
 * 幂等：按固定 id 先删后插。
 *
 * 用法：pnpm tsx scripts/seed-orders.ts
 */
import { getSupabaseClient, loadEnv } from '../src/storage/database/supabase-client';

const CUSTOMERS = [
  {
    id: '66666666-0000-0000-0000-000000000001',
    name: '林晚晴',
    phone: '13800138001',
    address: '上海市静安区南京西路 1788 号静安嘉里中心 2 座 2301',
  },
  {
    id: '66666666-0000-0000-0000-000000000002',
    name: '顾承宇',
    phone: '13900139002',
    address: '上海市徐汇区衡山路 123 弄 8 号',
  },
  {
    id: '66666666-0000-0000-0000-000000000003',
    name: '苏蔓',
    phone: '13700137003',
    address: '上海市黄浦区外滩中心 18 楼',
  },
] as const;

interface SeedOrder {
  id: string;
  order_no: string;
  customerIndex: number;
  total_amount: string;
  delivery_fee: string;
  status: 'pending_payment' | 'paid' | 'making' | 'delivering' | 'completed' | 'cancelled';
  remark: string | null;
  completed_at: string | null;
  itemProductIndex: number;
  itemName: string;
  itemPrice: string;
  itemImage: string;
}

const ORDERS: SeedOrder[] = [
  {
    id: '77777777-0000-0000-0000-000000000001',
    order_no: 'CF20260920001',
    customerIndex: 0,
    total_amount: '427.00',
    delivery_fee: '28.00',
    status: 'delivering',
    remark: '下午 3 点前送达，附手写贺卡',
    completed_at: null,
    itemProductIndex: 0,
    itemName: '晨曦玫瑰花束',
    itemPrice: '399.00',
    itemImage:
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900&q=80',
  },
  {
    id: '77777777-0000-0000-0000-000000000002',
    order_no: 'CF20260920002',
    customerIndex: 1,
    total_amount: '699.00',
    delivery_fee: '0.00',
    status: 'paid',
    remark: '到店自取',
    completed_at: null,
    itemProductIndex: 4,
    itemName: '永生玫瑰玻璃罩',
    itemPrice: '699.00',
    itemImage:
      'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=900&q=80',
  },
  {
    id: '77777777-0000-0000-0000-000000000003',
    order_no: 'CF20260919003',
    customerIndex: 2,
    total_amount: '888.00',
    delivery_fee: '0.00',
    status: 'completed',
    remark: '开业花篮，红丝带写「开业大吉」',
    completed_at: '2026-09-19T14:20:00Z',
    itemProductIndex: 6,
    itemName: '开业大吉双层花篮',
    itemPrice: '888.00',
    itemImage:
      'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=900&q=80',
  },
  {
    id: '77777777-0000-0000-0000-000000000004',
    order_no: 'CF20260920004',
    customerIndex: 0,
    total_amount: '386.00',
    delivery_fee: '28.00',
    status: 'pending_payment',
    remark: null,
    completed_at: null,
    itemProductIndex: 1,
    itemName: '雾白郁金香花束',
    itemPrice: '358.00',
    itemImage:
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=900&q=80',
  },
  {
    id: '77777777-0000-0000-0000-000000000005',
    order_no: 'CF20260918005',
    customerIndex: 1,
    total_amount: '588.00',
    delivery_fee: '0.00',
    status: 'paid',
    remark: null,
    completed_at: null,
    itemProductIndex: 5,
    itemName: '永生花礼盒 · 橙意',
    itemPrice: '588.00',
    itemImage:
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=900&q=80',
  },
];

const PRODUCT_IDS = [
  '22222222-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000003',
  '22222222-0000-0000-0000-000000000004',
  '22222222-0000-0000-0000-000000000005',
  '22222222-0000-0000-0000-000000000006',
  '22222222-0000-0000-0000-000000000007',
  '22222222-0000-0000-0000-000000000008',
  '22222222-0000-0000-0000-000000000009',
  '22222222-0000-0000-0000-000000000010',
  '22222222-0000-0000-0000-000000000011',
];

async function main(): Promise<void> {
  loadEnv();
  const client = getSupabaseClient();

  // 幂等清理
  await client.from('order_items').delete().in(
    'order_id',
    ORDERS.map((o) => o.id)
  );
  await client.from('orders').delete().in(
    'id',
    ORDERS.map((o) => o.id)
  );
  await client.from('customers').delete().in(
    'id',
    CUSTOMERS.map((c) => c.id)
  );

  const { error: custErr } = await client.from('customers').insert(
    CUSTOMERS.map((c) => ({ ...c, openid: null, nickname: null, remark: null }))
  );
  if (custErr) throw new Error(`客户种子失败: ${custErr.message}`);

  const { error: orderErr } = await client.from('orders').insert(
    ORDERS.map((o) => {
      const c = CUSTOMERS[o.customerIndex];
      return {
        id: o.id,
        order_no: o.order_no,
        customer_id: c.id,
        customer_name: c.name,
        customer_phone: c.phone,
        address: c.address,
        remark: o.remark,
        total_amount: o.total_amount,
        delivery_fee: o.delivery_fee,
        status: o.status,
        completed_at: o.completed_at,
      };
    })
  );
  if (orderErr) throw new Error(`订单种子失败: ${orderErr.message}`);

  const { error: itemErr } = await client.from('order_items').insert(
    ORDERS.map((o, i) => ({
      // 让明细 id 唯一但确定
      id: `88888888-0000-0000-0000-00000000000${i + 1}`,
      order_id: o.id,
      product_id: PRODUCT_IDS[o.itemProductIndex],
      product_name: o.itemName,
      price: o.itemPrice,
      quantity: 1,
      subtotal: o.itemPrice,
      main_image: o.itemImage,
    }))
  );
  if (itemErr) throw new Error(`订单明细种子失败: ${itemErr.message}`);

  console.log(`[OK] 已写入 ${CUSTOMERS.length} 位客户、${ORDERS.length} 笔订单及明细`);
}

main().catch((err: unknown) => {
  console.error('[ERROR]', err instanceof Error ? err.message : err);
  process.exit(1);
});
