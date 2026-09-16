'use client';

import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { DEFAULT_THEME } from '@/lib/constants';
import type { ThemeSettings } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const FIELDS: { key: keyof ThemeSettings; label: string; hint: string }[] = [
  { key: 'primary', label: '主题色', hint: '品牌点缀色，用于按钮、标签与强调' },
  { key: 'background', label: '背景底色', hint: '小程序页面与卡片底色' },
  { key: 'text_primary', label: '主文字色', hint: '标题与重点信息' },
  { key: 'text_secondary', label: '次级文字色', hint: '说明、价格以外的正文' },
  { key: 'text_tertiary', label: '辅助文字色', hint: '时间、提示等弱化信息' },
];

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export default function ThemePage() {
  const [theme, setTheme] = useState<ThemeSettings>({ ...DEFAULT_THEME });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get<ThemeSettings>('/admin/theme')
      .then(setTheme)
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof ThemeSettings, value: string) => {
    setTheme((t) => ({ ...t, [key]: value }));
  };

  const save = async () => {
    for (const f of FIELDS) {
      if (!HEX_RE.test(theme[f.key])) {
        return toast.error(`「${f.label}」不是合法的 HEX 色值`);
      }
    }
    setSaving(true);
    try {
      await apiClient.put('/admin/theme', theme);
      toast.success('风格配置已保存，小程序前端将同步生效');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl tracking-wide">设计风格</h1>
          <p className="mt-1 text-sm text-muted">配置小程序视觉参数，右侧实时预览保存后的效果。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTheme({ ...DEFAULT_THEME })}>
            <RotateCcw className="h-4 w-4" />
            恢复默认
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存配置
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="card-luxury">
          <CardContent className="space-y-6 p-6">
            {FIELDS.map((f) => {
              const valid = HEX_RE.test(theme[f.key]);
              return (
                <div key={f.key} className="flex flex-wrap items-center gap-4">
                 
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-line">
                    <input
                      type="color"
                      aria-label={`${f.label}取色器`}
                      value={valid ? theme[f.key] : '#000000'}
                      onChange={(e) => update(f.key, e.target.value)}
                      className="absolute -left-2 -top-2 h-16 w-16 cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted">{f.hint}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={theme[f.key]}
                      maxLength={7}
                      className={cn(
                        'w-28 font-mono text-sm uppercase',
                        !valid && 'border-red-400 focus-visible:ring-red-400'
                      )}
                      onChange={(e) => update(f.key, e.target.value)}
                    />
                    {!valid && <span className="text-xs text-red-500">色值无效</span>}
                  </div>
                </div>
              );
            })}

            <div className="rounded-md bg-muted/50 p-4 text-xs leading-relaxed text-muted">
              默认配色为爱马仕橙 <span className="font-mono">#E8830C</span> 与米白{' '}
              <span className="font-mono">#F7F3ED</span>，小程序端通过同一数据库读取配置，无需发版即可换肤。
            </div>
          </CardContent>
        </Card>

        <ThemePreview theme={theme} />
      </div>
    </div>
  );
}

function ThemePreview({ theme }: { theme: ThemeSettings }) {
  return (
    <Card className="card-luxury h-fit lg:sticky lg:top-24">
      <CardContent className="p-6">
        <p className="mb-4 text-center text-xs tracking-[0.3em] text-muted">PREVIEW</p>
        <div
          className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[28px] border border-line shadow-xl"
          style={{ backgroundColor: theme.background }}
        >
          <div className="px-5 pb-5 pt-6" style={{ color: theme.text_primary }}>
            <p
              className="text-center text-[10px] tracking-[0.35em]"
              style={{ color: theme.text_tertiary }}
            >
              CHLOE FLORA
            </p>
            <p className="mt-2 text-center font-serif text-xl leading-snug">
              一束花
              <br />
              一段故事
            </p>

            <div
              className="mt-4 flex h-28 items-end rounded-lg p-3"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}26, ${theme.primary}08)`,
              }}
            >
              <span
                className="rounded-full px-2.5 py-1 text-[10px] text-white"
                style={{ backgroundColor: theme.primary }}
              >
                新品上市
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {['婚礼花艺', '永生花礼'].map((name) => (
                <div
                  key={name}
                  className="rounded-md p-2.5"
                  style={{ backgroundColor: `${theme.primary}0d` }}
                >
                  <div
                    className="mb-2 h-12 rounded"
                    style={{ backgroundColor: `${theme.primary}22` }}
                  />
                  <p className="text-[11px]" style={{ color: theme.text_secondary }}>
                    {name}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2 rounded-lg bg-white/70 p-2.5 shadow-sm">
              <div className="h-12 w-12 shrink-0 rounded" style={{ backgroundColor: `${theme.primary}33` }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">晨曦玫瑰花束</p>
                <p className="mt-0.5 text-[10px]" style={{ color: theme.text_tertiary }}>
                  当季优选 · 同城配送
                </p>
                <p className="mt-0.5 text-xs font-medium" style={{ color: theme.primary }}>
                  ¥399
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-full py-2 text-center text-xs tracking-widest text-white"
              style={{ backgroundColor: theme.primary }}
            >
              立即定制
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
