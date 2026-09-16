'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Flower2, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useSupabaseConfig } from '@/lib/supabase-config-inject';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const { isLoading: configLoading, error: configError } = useSupabaseConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 已登录则直接进后台
  useEffect(() => {
    if (configLoading) return;
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [configLoading, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('请输入邮箱与密码');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError || !data.session) {
        setError(normalizeAuthError(signInError?.message));
        return;
      }

      // 二次校验：该账号必须是管理员白名单
      const res = await fetch('/api/admin/me', {
        headers: { 'x-session': data.session.access_token },
      });
      if (res.status === 403) {
        await supabase.auth.signOut();
        setError('该账号无管理员权限，请使用店主账号登录');
        return;
      }
      if (!res.ok) {
        await supabase.auth.signOut();
        setError('登录校验失败，请稍后重试');
        return;
      }

      router.replace('/dashboard');
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cf-bg px-4">
      {/* 细装饰线与角落品牌字 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cf-line to-transparent" />
        <p className="absolute bottom-6 left-0 w-full text-center text-[11px] tracking-[0.35em] text-cf-text-3">
          FLOWERS · QUIETLY · LUXURIOUS
        </p>
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="rounded-xl border border-cf-line bg-cf-card px-10 py-11 shadow-card">
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-cf-line bg-cf-input">
              <Image
                src="/app-icon.jpg"
                alt="Chloe Flora"
                width={64}
                height={64}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="mt-5 font-display text-[26px] font-semibold tracking-wide text-cf-text-1">
              Chloe Flora
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] tracking-[0.2em] text-cf-text-3">
              <Flower2 className="h-3 w-3 text-cf-primary" />
              花艺工作室管理后台
            </p>
          </div>

          <div className="my-7 h-px bg-cf-line" />

          {configError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>服务配置加载失败，请刷新重试</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] text-cf-text-2">
                管理员邮箱
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cf-text-3" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@chloeflora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting || configLoading}
                  className="h-11 rounded-lg border-cf-line bg-cf-input pl-9 text-[14px] focus-visible:ring-cf-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] text-cf-text-2">
                密码
              </Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cf-text-3" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="请输入登录密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting || configLoading}
                  className="h-11 rounded-lg border-cf-line bg-cf-input pl-9 pr-10 text-[14px] focus-visible:ring-cf-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cf-text-3 transition-base hover:text-cf-text-2"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || configLoading}
              className="h-11 w-full rounded-lg bg-cf-primary text-[14px] font-medium tracking-widest text-white hover:bg-cf-primary-hover"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中
                </>
              ) : (
                '登 录'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px] text-cf-text-3">
          仅限店铺管理员访问 · 账号由系统开通
        </p>
      </div>
    </div>
  );
}

function normalizeAuthError(message: string | undefined): string {
  if (!message) return '邮箱或密码错误';
  if (/invalid login/i.test(message)) return '邮箱或密码错误';
  if (/email not confirmed/i.test(message)) return '账号尚未确认，请联系管理员';
  return message;
}
