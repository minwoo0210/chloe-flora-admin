'use client';

import { useState } from 'react';
import { GripVertical, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/admin/image-uploader';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { apiClient } from '@/lib/api-client';
import type { BannerRow } from '@/lib/types';

interface BannerManagerProps {
  banners: BannerRow[];
  onChange: () => void;
}

interface FormState {
  title: string;
  image_key: string;
  link_target: string;
  sort_order: number;
  is_active: boolean;
}

export function BannerManager({ banners, onChange }: BannerManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: '',
    image_key: '',
    link_target: '',
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<BannerRow | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setCreating(true);
    setForm({
      title: '',
      image_key: '',
      link_target: '',
      sort_order: banners.length,
      is_active: true,
    });
  };

  const startEdit = (b: BannerRow) => {
    setCreating(false);
    setEditingId(b.id);
    setForm({
      title: b.title ?? '',
      image_key: b.image_key ?? '',
      link_target: b.link_target ?? '',
      sort_order: b.sort_order,
      is_active: b.is_active,
    });
  };

  const save = async () => {
    if (!form.image_key) return toast.error('请先上传轮播图');
    setSaving(true);
    try {
      const payload = {
        title: form.title || null,
        image_key: form.image_key,
        link_target: form.link_target || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (editingId) {
        await apiClient.patch(`/admin/homepage/banners/${editingId}`, payload);
        toast.success('Banner 已更新');
      } else {
        await apiClient.post('/admin/homepage/banners', payload);
        toast.success('Banner 已添加');
      }
      setCreating(false);
      setEditingId(null);
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: BannerRow) => {
    try {
      await apiClient.patch(`/admin/homepage/banners/${b.id}`, { is_active: !b.is_active });
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {banners.map((b) => (
          <div
            key={b.id}
            className="group overflow-hidden rounded-md border border-line bg-surface"
          >
            {editingId === b.id ? (
              <div className="space-y-3 p-3">
                <ImageUploader
                  value={form.image_key || b.image_url || ''}
                  onChange={(url) => setForm((f) => ({ ...f, image_key: url }))}
                  ratioHint="16:9"
                  folder="banners"
                />
                <Input
                  value={form.title}
                  placeholder="标题（可选）"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                <Input
                  value={form.link_target}
                  placeholder="跳转目标（可选，如 category:wedding）"
                  onChange={(e) => setForm((f) => ({ ...f, link_target: e.target.value }))}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-muted">
                    排序
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    启用
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    取消
                  </Button>
                  <Button size="sm" onClick={save} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '保存'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative aspect-[16/9] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image_url ?? ''} alt={b.title ?? 'banner'} className="h-full w-full object-cover" />
                  {!b.is_active && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/50 text-xs tracking-widest text-white">
                      已停用
                    </div>
                  )}
                  <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded bg-white/85 text-muted">
                    <GripVertical className="h-3 w-3" />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.title || '未命名 Banner'}</p>
                    <p className="text-xs text-muted">排序 {b.sort_order}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Switch checked={b.is_active} onCheckedChange={() => void toggleActive(b)} aria-label="启用" />
                    <Button size="icon" variant="ghost" onClick={() => startEdit(b)} aria-label="编辑">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted hover:text-red-600"
                      onClick={() => setDeleting(b)}
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {creating && (
          <div className="space-y-3 rounded-md border border-dashed border-brand/50 bg-brand/[0.03] p-3">
            <ImageUploader
              value={form.image_key.startsWith('http') ? form.image_key : ''}
              onChange={(url) => setForm((f) => ({ ...f, image_key: url }))}
              ratioHint="16:9"
              folder="banners"
            />
            <Input
              value={form.title}
              placeholder="标题（可选）"
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Input
              value={form.link_target}
              placeholder="跳转目标（可选，如 category:wedding）"
              onChange={(e) => setForm((f) => ({ ...f, link_target: e.target.value }))}
            />
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted">
                排序
                <Input
                  type="number"
                  className="mt-1 h-8 w-20"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
                  }
                />
              </Label>
              <label className="flex items-center gap-2 text-xs text-muted">
                启用
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setCreating(false)}>
                <X className="h-4 w-4" /> 取消
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '添加'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {!creating && (
        <Button variant="outline" onClick={startCreate}>
          <Plus className="h-4 w-4" /> 添加 Banner
        </Button>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="删除 Banner"
        description="删除后小程序首页将不再展示该轮播图。"
        confirmText="删除"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await apiClient.del(`/admin/homepage/banners/${deleting.id}`);
            toast.success('Banner 已删除');
            setDeleting(null);
            onChange();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : '删除失败');
          }
        }}
      />
    </div>
  );
}
