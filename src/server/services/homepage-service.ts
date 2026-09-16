import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { resolveMediaUrl } from '@/lib/storage';
import type {
  BannerRow,
  CategorySectionRow,
  HotRecommendationRow,
} from '@/lib/types';

type BannerRecord = Omit<BannerRow, 'image_url'>;
type SectionRecord = Omit<CategorySectionRow, 'image_url' | 'categories'>;
type HotRecord = Omit<HotRecommendationRow, 'image_url' | 'products'>;

// ───────────────────────── Banners ─────────────────────────

export async function listBanners(): Promise<BannerRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(`查询 Banner 失败: ${error.message}`);
  const records = (data ?? []) as BannerRecord[];
  return Promise.all(
    records.map(async (r) => ({ ...r, image_url: await resolveMediaUrl(r.image_key) }))
  );
}

export interface BannerInput {
  title?: string | null;
  image_key: string;
  link_target?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export async function createBanner(input: BannerInput): Promise<BannerRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('banners')
    .insert({
      title: input.title ?? null,
      image_key: input.image_key,
      link_target: input.link_target ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`创建 Banner 失败: ${error.message}`);
  return data as BannerRow;
}

export async function updateBanner(id: string, input: Partial<BannerInput>): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('banners')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`更新 Banner 失败: ${error.message}`);
}

export async function deleteBanner(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('banners').delete().eq('id', id);
  if (error) throw new Error(`删除 Banner 失败: ${error.message}`);
}

// ───────────────────── Category sections ─────────────────────

export async function listSections(): Promise<CategorySectionRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('category_sections')
    .select('*, categories(id, name)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(`查询宣传区失败: ${error.message}`);
  const records = (data ?? []) as (SectionRecord & {
    categories: { id: string; name: string } | null;
  })[];
  return Promise.all(
    records.map(async (r) => ({
      ...r,
      image_url: await resolveMediaUrl(r.image_key),
    }))
  );
}

export interface SectionInput {
  title: string;
  subtitle?: string | null;
  image_key: string;
  category_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export async function createSection(input: SectionInput): Promise<CategorySectionRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('category_sections')
    .insert({
      title: input.title,
      subtitle: input.subtitle ?? null,
      image_key: input.image_key,
      category_id: input.category_id ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`创建宣传区失败: ${error.message}`);
  return data as CategorySectionRow;
}

export async function updateSection(
  id: string,
  input: Partial<SectionInput>
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('category_sections')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`更新宣传区失败: ${error.message}`);
}

export async function deleteSection(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('category_sections').delete().eq('id', id);
  if (error) throw new Error(`删除宣传区失败: ${error.message}`);
}

// ─────────────────── Hot recommendations ────────────────────

export async function listHotRecommendations(): Promise<HotRecommendationRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('hot_recommendations')
    .select(
      '*, products(id, name, price, main_image, status)'
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(`查询推荐位失败: ${error.message}`);
  const records = (data ?? []) as (HotRecord & {
    products: {
      id: string;
      name: string;
      price: string;
      main_image: string | null;
      status: string;
    } | null;
  })[];
  return Promise.all(
    records.map(async (r) => ({
      ...r,
      image_url: r.products ? await resolveMediaUrl(r.products.main_image) : null,
    }))
  );
}

export interface HotInput {
  product_id: string;
  title?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export async function createHotRecommendation(
  input: HotInput
): Promise<{ id: string; revived: boolean }> {
  const client = getSupabaseClient();

  // 每个商品仅可占一个推荐位：存在则更新并重新启用，避免唯一索引冲突
  const { data: existing, error: findError } = await client
    .from('hot_recommendations')
    .select('id')
    .eq('product_id', input.product_id)
    .maybeSingle();
  if (findError) throw new Error(`查询推荐位失败: ${findError.message}`);

  if (existing) {
    const { error } = await client
      .from('hot_recommendations')
      .update({
        title: input.title ?? null,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) {
      if (/duplicate|unique/i.test(error.message)) throw new Error('该商品已在推荐位中');
      throw new Error(`添加推荐失败: ${error.message}`);
    }
    return { id: existing.id, revived: true };
  }

  const { data: inserted, error } = await client
    .from('hot_recommendations')
    .insert({
      product_id: input.product_id,
      title: input.title ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) {
    if (/duplicate|unique/i.test(error.message)) throw new Error('该商品已在推荐位中');
    throw new Error(`添加推荐失败: ${error.message}`);
  }
  return { id: inserted.id, revived: false };
}

export async function updateHotRecommendation(
  id: string,
  input: Partial<Omit<HotInput, 'product_id'>>
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('hot_recommendations')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`更新推荐失败: ${error.message}`);
}

export async function deleteHotRecommendation(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('hot_recommendations').delete().eq('id', id);
  if (error) throw new Error(`移除推荐失败: ${error.message}`);
}
