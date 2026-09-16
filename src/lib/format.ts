/** 页面通用格式化工具 */

/** 分/元皆可：按数字金额格式化为 ¥1,234.00 */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '¥0.00';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '¥0.00';
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 价格输入框：只保留数字与两位小数 */
export function formatCurrencyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length === 1) return parts[0] ?? '';
  return `${parts[0] ?? ''}.${(parts.slice(1).join('') ?? '').slice(0, 2)}`;
}

/** 日期：YYYY-MM-DD */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number): string => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 日期时间：YYYY-MM-DD HH:mm */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number): string => String(x).padStart(2, '0');
  return `${formatDate(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
