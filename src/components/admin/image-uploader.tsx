'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

/** 存储 key 或外链 → 可直接展示的地址 */
function toPreview(value: string): string {
  if (!value) return '';
  if (/^https?:\/\//.test(value)) return value;
  return `/api/media?key=${encodeURIComponent(value)}`;
}

interface ImageUploaderProps {
  value: string;
  onChange: (publicUrl: string) => void;
  /** 推荐比例文案，如 16:9、1:1 */
  ratioHint?: string;
  className?: string;
  folder?: string;
}

export function ImageUploader({
  value,
  onChange,
  ratioHint,
  className,
  folder = 'site',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const preview = useMemo(() => toPreview(value), [value]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('图片不能超过 8MB');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const url = await apiClient.uploadMedia(file, folder);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={cn(
          'group relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-line transition-colors',
          'bg-muted/40 hover:border-brand hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand'
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="预览图"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-ink/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-xs font-medium tracking-wider text-white">替换图片</span>
              <button
                type="button"
                className="rounded-full bg-white/90 p-1.5 text-ink transition-colors hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                aria-label="移除图片"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
            <span className="text-xs tracking-wide">上传中…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-muted">
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs tracking-wide">点击上传图片</span>
            {ratioHint ? (
              <span className="text-[11px] text-muted/70">建议比例 {ratioHint}，≤ 8MB</span>
            ) : (
              <span className="text-[11px] text-muted/70">JPG / PNG / WebP，≤ 8MB</span>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
