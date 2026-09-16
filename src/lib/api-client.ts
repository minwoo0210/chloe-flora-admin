'use client';

import { getSupabaseBrowserClient } from './supabase-browser';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  // 上传 FormData 时使用，内部不设置 Content-Type
  formData?: FormData;
  cache?: RequestCache;
}

/**
 * 后台统一请求：自动携带 x-session（access_token 每次实时获取，不缓存），
 * 401 时跳转登录页。
 */
export async function adminFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = '/login';
    throw new ApiError('未登录', 401);
  }

  const headers: Record<string, string> = {
    'x-session': session.access_token,
  };
  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const res = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body,
    cache: options.cache ?? 'no-store',
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.href = '/login';
    throw new ApiError('登录已过期，请重新登录', 401);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : null;

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `请求失败（${res.status}）`;
    throw new ApiError(message, res.status);
  }

  return payload as T;
}

/**
 * 页面使用的语义化客户端：路径基于 /api（如 '/admin/products'）。
 * 返回后端 JSON；uploadMedia 走 multipart 并返回 { url }。
 */
export const apiClient = {
  get<T = unknown>(path: string): Promise<T> {
    return adminFetch<T>(`/api${path}`);
  },
  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return adminFetch<T>(`/api${path}`, { method: 'POST', body });
  },
  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return adminFetch<T>(`/api${path}`, { method: 'PUT', body });
  },
  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return adminFetch<T>(`/api${path}`, { method: 'PATCH', body });
  },
  del<T = unknown>(path: string): Promise<T> {
    return adminFetch<T>(`/api${path}`, { method: 'DELETE' });
  },
  /** 上传图片，返回对象存储 key（业务表持久化 key，展示时经 resolveMediaUrl 签名） */
  async uploadMedia(file: File, folder: string): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('dir', folder);
    const res = await adminFetch<{ key: string; url: string }>('/api/admin/upload', {
      formData: form,
    });
    return res.key;
  },
};
