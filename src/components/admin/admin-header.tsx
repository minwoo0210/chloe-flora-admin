'use client';

import { useState } from 'react';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';
import { useSignOut } from '@/lib/use-auth';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  email?: string;
}

export function AdminHeader({ title, subtitle, email }: AdminHeaderProps) {
  const signOut = useSignOut();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-cf-line bg-cf-bg/85 px-5 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 md:hidden"
              aria-label="打开导航"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>后台导航</SheetTitle>
            </SheetHeader>
            <AdminSidebar onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <div>
          <h1 className="font-serif text-[19px] font-medium text-cf-text-1">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 hidden text-[12px] text-cf-text-3 sm:block">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2.5 text-[13px] text-cf-text-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cf-primary/10 font-display text-[13px] font-semibold text-cf-primary">
              C
            </span>
            <span className="hidden max-w-[180px] truncate md:inline">{email ?? '管理员'}</span>
            <ChevronDown className="h-3.5 w-3.5 text-cf-text-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-lg">
          <DropdownMenuLabel className="text-[12px] text-cf-text-3">
            店铺管理员
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-[13px] text-[#A8453B] focus:text-[#A8453B]"
            onSelect={(e) => {
              e.preventDefault();
              setLogoutOpen(true);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.6} />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">确认退出登录？</AlertDialogTitle>
            <AlertDialogDescription>
              退出后需要重新使用管理员账号登录后台。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#A8453B] hover:bg-[#923930]"
              onClick={() => {
                void signOut();
              }}
            >
              退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
