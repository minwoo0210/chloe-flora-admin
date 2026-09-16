import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  listBanners,
  listHotRecommendations,
  listSections,
} from '@/server/services/homepage-service';
import { getBrandSettings } from '@/server/services/settings-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  const [banners, sections, hotRecommendations, brand] = await Promise.all([
    listBanners(),
    listSections(),
    listHotRecommendations(),
    getBrandSettings(),
  ]);
  return NextResponse.json({ banners, sections, hotRecommendations, brand });
}
