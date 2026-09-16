import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { extFromContentType, sanitizeFileName, uploadImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * 图片上传：multipart/form-data，字段名 file，可选字段 dir（默认 uploads）
 * 返回 { key, url } —— 业务表必须持久化 key。
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ('response' in guard) return guard.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: '表单解析失败' }, { status: 400 });
  }

  const file = form.get('file');
  const dir = (form.get('dir') as string | null)?.replace(/[^\w-]/g, '') || 'uploads';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '缺少 file 文件' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: '仅支持 JPG / PNG / WebP / GIF 图片' },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '图片不能超过 10MB' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const ext = extFromContentType(file.type);
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
  const suggestedKey = `${dir}/${baseName}_${Date.now()}.${ext}`;

  const key = await uploadImage(Buffer.from(arrayBuffer), suggestedKey, file.type);
  return NextResponse.json({ key, url: `/api/media?key=${encodeURIComponent(key)}` });
}
