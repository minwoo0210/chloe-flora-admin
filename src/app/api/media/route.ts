import { NextRequest, NextResponse } from 'next/server';
import { resolveMediaUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * 媒体代理：/api/media?key=products/xxx.jpg
 * 302 跳转到对象存储签名 URL。数据库只持久化 key，签名链接按需生成。
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'missing key' }, { status: 400 });
  }
  // 仅允许对象 key，禁止把它当开放重定向代理
  if (/^https?:\/\//.test(key) || key.includes('..')) {
    return NextResponse.json({ error: 'invalid key' }, { status: 400 });
  }
  try {
    const url = await resolveMediaUrl(key);
    if (!url) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    return NextResponse.redirect(url, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    console.error('resolve media failed:', error);
    return NextResponse.json({ error: 'media unavailable' }, { status: 502 });
  }
}
