import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { DEFAULT_BRAND, DEFAULT_THEME } from '@/lib/constants';
import type { BrandSettings, ThemeSettings } from '@/lib/types';

export type SettingsKey = 'brand' | 'theme';

async function readSetting<T extends object>(
  key: SettingsKey,
  fallback: T
): Promise<T> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw new Error(`读取配置失败: ${error.message}`);
  if (!data?.value) return fallback;
  return { ...fallback, ...(data.value as Partial<T>) };
}

async function writeSetting(key: SettingsKey, value: object): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('site_settings')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  if (error) throw new Error(`保存配置失败: ${error.message}`);
}

export async function getBrandSettings(): Promise<BrandSettings> {
  return readSetting<BrandSettings>('brand', { ...DEFAULT_BRAND });
}

export async function saveBrandSettings(value: BrandSettings): Promise<void> {
  await writeSetting('brand', value);
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  return readSetting<ThemeSettings>('theme', { ...DEFAULT_THEME });
}

export async function saveThemeSettings(value: ThemeSettings): Promise<void> {
  await writeSetting('theme', value);
}
