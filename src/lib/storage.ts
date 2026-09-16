import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadEnv } from '@/storage/database/supabase-client';

/** 图片桶名（公开读取，仅服务端写入） */
const BUCKET = 'media';

let clientInstance: SupabaseClient | null = null;
let bucketReady: Promise<void> | null = null;

/** Supabase 服务端存储客户端（service role，绕过 RLS） */
function getStorageClient(): SupabaseClient {
  loadEnv();
  if (clientInstance === null) {
    const url = process.env.COZE_SUPABASE_URL;
    const serviceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error('COZE_SUPABASE_URL is not set');
    if (!serviceKey) throw new Error('COZE_SUPABASE_SERVICE_ROLE_KEY is not set');
    clientInstance = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return clientInstance;
}

/** 确保媒体桶存在且公开可读（幂等，仅执行一次） */
function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const client = getStorageClient();
      const { error } = await client.storage.createBucket(BUCKET, { public: true });
      // 桶已存在属于预期情况，忽略 409/duplicate，其余错误继续抛出
      if (error && !/already exists|duplicate|409/i.test(error.message)) {
        throw error;
      }
    })();
  }
  return bucketReady;
}

/** 存储 key → 可直接访问的公开 URL；空 key 返回 null；外链原样返回 */
export async function resolveMediaUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  if (/^https?:\/\//.test(key)) return key; // 兼容历史外链数据
  const client = getStorageClient();
  const { data } = client.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

/** 批量解析（保持入参顺序） */
export async function resolveMediaUrls(
  keys: Array<string | null | undefined>
): Promise<Array<string | null>> {
  return Promise.all(keys.map((k) => resolveMediaUrl(k)));
}

/** 规范化上传文件名：仅保留安全字符 */
export function sanitizeFileName(name: string): string {
  return (
    name
      .trim()
      .replace(/[^\w.\-一-龥]/g, '_')
      .slice(0, 120) || 'file'
  );
}

/** 上传图片到 Supabase Storage，返回桶内相对 key（持久化 key，而非完整 URL） */
export async function uploadImage(
  buffer: Buffer,
  suggestedKey: string,
  contentType: string
): Promise<string> {
  await ensureBucket();
  const client = getStorageClient();
  const { data, error } = await client.storage
    .from(BUCKET)
    .upload(suggestedKey, buffer, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    });
  if (error || !data) {
    throw new Error(error?.message || '图片上传失败');
  }
  return data.path;
}

/** 删除图片（软失败，不阻断业务） */
export async function deleteMedia(key: string | null | undefined): Promise<void> {
  if (!key || /^https?:\/\//.test(key)) return;
  const client = getStorageClient();
  await client.storage.from(BUCKET).remove([key]);
}

/** 提取图片扩展名 */
export function extFromContentType(contentType: string, fallback = 'jpg'): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[contentType.toLowerCase()] ?? fallback;
}
