import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { listCustomers } from '@/server/services/order-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const keyword = req.nextUrl.searchParams.get('keyword') ?? undefined;
  const items = await listCustomers(keyword);
  return NextResponse.json({ items });
}
