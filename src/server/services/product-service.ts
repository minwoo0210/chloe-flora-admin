import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { resolveMediaUrl } from '@/lib/storage';
import type { ProductRow, ProductWithCategory } from '@/lib/types';

export interface ProductListQuery {
  categoryId?: string;
  status?: 'active' | 'inactive';
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  items: ProductWithCategory[];
  total: number;
  page: number;
  pageSize: number;
}

interface ProductRecord extends ProductRow {
  categories: { id: string; name: string; slug: string } | null;
}

export async function listProducts(query: ProductListQuery = {}): Promise<ProductListResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 12));
  const client = getSupabaseClient();

  let dbQuery = client
    .from('products')
    .select('*, categories(id, name, slug)', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (query.categoryId) dbQuery = dbQuery.eq('category_id', query.categoryId);
  if (query.status) dbQuery = dbQuery.eq('status', query.status);
  if (query.keyword?.trim()) {
    dbQuery = dbQuery.ilike('name', `%${query.keyword.trim()}%`);
  }

  dbQuery = dbQuery.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await dbQuery;
  if (error) throw new Error(`查询商品失败: ${error.message}`);

  const records = (data ?? []) as ProductRecord[];
  const items = await Promise.all(
    records.map(async (r) => ({
      ...r,
      image_url: await resolveMediaUrl(r.main_image),
    }))
  );

  return { items, total: count ?? 0, page, pageSize };
}

export async function getProduct(id: string): Promise<ProductWithCategory | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`查询商品失败: ${error.message}`);
  if (!data) return null;
  const record = data as ProductRecord;
  return { ...record, image_url: await resolveMediaUrl(record.main_image) };
}

export interface ProductInput {
  name: string;
  price: number | string;
  original_price?: number | string | null;
  main_image?: string | null;
  description?: string | null;
  category_id: string;
  status: 'active' | 'inactive';
  stock: number;
  sort_order?: number;
}

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('products')
    .insert({
      name: input.name,
      price: String(input.price),
      original_price:
        input.original_price === null || input.original_price === '' || input.original_price === undefined
          ? null
          : String(input.original_price),
      main_image: input.main_image ?? null,
      description: input.description ?? null,
      category_id: input.category_id,
      status: input.status,
      stock: input.stock,
      sort_order: input.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`创建商品失败: ${error.message}`);
  return data as ProductRow;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<ProductRow> {
  const client = getSupabaseClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (key === 'price' || key === 'original_price') {
      payload[key] = value === null || value === '' ? null : String(value);
    } else {
      payload[key] = value;
    }
  }
  const { data, error } = await client
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新商品失败: ${error.message}`);
  return data as ProductRow;
}

export async function deleteProduct(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) throw new Error(`删除商品失败: ${error.message}`);
}

export async function listProductsByIds(ids: string[]): Promise<ProductRow[]> {
  if (ids.length === 0) return [];
  const client = getSupabaseClient();
  const { data, error } = await client.from('products').select('*').in('id', ids);
  if (error) throw new Error(`查询商品失败: ${error.message}`);
  return (data ?? []) as ProductRow[];
}
