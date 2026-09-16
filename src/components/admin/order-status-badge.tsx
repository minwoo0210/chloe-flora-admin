import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES, type OrderStatus } from '@/lib/constants';

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide',
        ORDER_STATUS_STYLES[status].cls,
        className
      )}
    >
      <span className={cn('h-1 w-1 rounded-full', ORDER_STATUS_STYLES[status].dot)} />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
