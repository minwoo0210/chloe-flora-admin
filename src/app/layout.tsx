import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SupabaseConfigProvider } from '@/lib/supabase-config-inject';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: {
    default: 'Chloe Flora · 花艺工作室管理后台',
    template: '%s · Chloe Flora 后台',
  },
  description:
    'Chloe Flora 高级定制花艺工作室 Web 管理后台：商品、首页内容、视觉风格、订单与客户统一管理。',
};

export const viewport: Viewport = {
  themeColor: '#F7F3ED',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-cf-bg text-cf-text-1 antialiased">
        <SupabaseConfigProvider>{children}</SupabaseConfigProvider>
        <Toaster position="top-center" richColors={false} />
      </body>
    </html>
  );
}
