import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { CategoryRow } from '@/lib/types';

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export async function listCategories(includeInactive = true): Promise<CategoryRow[]> {
  const client = getSupabaseClient();
  let query = client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw new Error(`查询分类失败: ${error.message}`);
  return (data ?? []) as CategoryRow[];
}

export async function getCategory(id: string): Promise<CategoryRow | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`查询分类失败: ${error.message}`);
  return (data as CategoryRow | null) ?? null;
}

export async function createCategory(input: CategoryInput): Promise<CategoryRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('categories')
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`创建分类失败: ${error.message}`);
  return data as CategoryRow;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<CategoryRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('categories')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新分类失败: ${error.message}`);
  return data as CategoryRow;
}

export async function deleteCategory(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('categories').delete().eq('id', id);
  if (error) throw new Error(`删除分类失败: ${error.message}`);
}

/** 删除前校验：分类下是否仍有商品 */
export async function countProductsInCategory(categoryId: string): Promise<number> {
  const client = getSupabaseClient();
  const { count, error } = await client
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);
  if (error) throw new Error(`校验分类商品失败: ${error.message}`);
  return count ?? 0;
}
