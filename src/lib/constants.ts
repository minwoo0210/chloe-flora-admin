/** 订单状态机（与小程序端共享） */
export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'making',
  'delivering',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** 兼容别名 */
export type OrderStatusValue = OrderStatus;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  making: '制作中',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
};

/** 页面与徽章组件使用的别名 */
export const ORDER_STATUS_LABELS = ORDER_STATUS_LABEL;

/** 允许的正向流转（管理员可在每一步直接推进，也可取消未完成订单） */
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['making', 'cancelled'],
  making: ['delivering', 'cancelled'],
  delivering: ['completed'],
  completed: [],
  cancelled: [],
};

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-50 text-[#B07D2B]',
  paid: 'bg-sky-50 text-sky-700',
  making: 'bg-violet-50 text-violet-700',
  delivering: 'bg-orange-50 text-[#D4740A]',
  completed: 'bg-emerald-50 text-[#3D7A5A]',
  cancelled: 'bg-stone-100 text-stone-500',
};

/** 徽章组件使用的样式映射别名（点 + 文字配色） */
export const ORDER_STATUS_STYLES: Record<OrderStatus, { dot: string; cls: string }> = {
  pending_payment: { dot: 'bg-[#B07D2B]', cls: 'bg-amber-50 text-[#B07D2B]' },
  paid: { dot: 'bg-sky-600', cls: 'bg-sky-50 text-sky-700' },
  making: { dot: 'bg-violet-600', cls: 'bg-violet-50 text-violet-700' },
  delivering: { dot: 'bg-[#D4740A]', cls: 'bg-orange-50 text-[#D4740A]' },
  completed: { dot: 'bg-[#3D7A5A]', cls: 'bg-emerald-50 text-[#3D7A5A]' },
  cancelled: { dot: 'bg-stone-400', cls: 'bg-stone-100 text-stone-500' },
};

/** 商品上下架 */
export const PRODUCT_STATUS_LABEL = {
  active: '上架中',
  inactive: '已下架',
} as const;

/** 小程序默认视觉参数（site_settings.theme 的兜底值） */
export const DEFAULT_THEME = {
  primary: '#E8830C',
  background: '#F7F3ED',
  text_primary: '#2B2622',
  text_secondary: '#6B625A',
  text_tertiary: '#A39A90',
} as const;

export const DEFAULT_BRAND = {
  studio_name: 'Chloe Flora',
  slogan_primary: '一束花，一段故事',
  slogan_secondary: '甄选当季花材，以法式美学定制每一份心意',
} as const;

/** 把存储 key 转成后台可用的媒体地址（外链原样返回） */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//.test(key)) return key;
  return `/api/media?key=${encodeURIComponent(key)}`;
}

export function formatPrice(value: string | number | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  if (Number.isNaN(n)) return '¥0.00';
  return `¥${n.toFixed(2)}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number): string => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
