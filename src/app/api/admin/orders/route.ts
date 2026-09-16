import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/constants';
import { listOrders } from '@/server/services/order-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const sp = req.nextUrl.searchParams;
  const statusParam = sp.get('status');
  const status = (ORDER_STATUSES as readonly string[]).includes(statusParam ?? '')
    ? (statusParam as OrderStatus)
    : undefined;

  const result = await listOrders({
    status,
    keyword: sp.get('keyword') ?? undefined,
    page: sp.get('page') ? Number(sp.get('page')) : 1,
    pageSize: sp.get('pageSize') ? Number(sp.get('pageSize')) : 10,
  });
  return NextResponse.json(result);
}
