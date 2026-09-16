import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { ORDER_STATUSES } from '@/lib/constants';
import { getOrder, updateOrderStatus } from '@/server/services/order-service';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  return NextResponse.json({ item: order });
}

const patchSchema = z.object({
  status: z.enum(ORDER_STATUSES as unknown as [string, ...string[]]),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '无效的订单状态' }, { status: 400 });
  }

  try {
    const item = await updateOrderStatus(id, parsed.data.status as (typeof ORDER_STATUSES)[number]);
    return NextResponse.json({ item });
  } catch (error) {
    const code = (error as { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '操作失败' },
      { status: code }
    );
  }
}
