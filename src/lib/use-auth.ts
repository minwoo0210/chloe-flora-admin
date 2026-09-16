'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useSupabaseConfig } from './supabase-config-inject';
import { getSupabaseBrowserClient } from './supabase-browser';

export interface AdminSession {
  user: User;
  email: string;
}

interface AuthState {
  status: 'loading' | 'authed' | 'guest';
  session: AdminSession | null;
}

/**
 * 监听 Supabase Auth 登录态。
 * 仅负责会话本身；管理员白名单由后端每个接口强制校验，
 * 前端在 /(admin) 布局里再拉一次 /api/admin/me 做页面级守卫。
 */
export function useAuthSubscription(): AuthState {
  const { isLoading: configLoading } = useSupabaseConfig();
  const [state, setState] = useState<AuthState>({ status: 'loading', session: null });

  useEffect(() => {
    if (configLoading) return;
    const supabase = getSupabaseBrowserClient();
    let active = true;

    const applyUser = (user: User | null): void => {
      if (!active) return;
      if (user && user.email) {
        setState({ status: 'authed', session: { user, email: user.email } });
      } else {
        setState({ status: 'guest', session: null });
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      applyUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configLoading]);

  return state;
}

/** 登出并回到登录页 */
export function useSignOut(): () => Promise<void> {
  return useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);
}
