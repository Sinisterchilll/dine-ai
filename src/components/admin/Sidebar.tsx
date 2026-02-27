'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, UtensilsCrossed, Tags, Settings, QrCode, BarChart3, LogOut, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/qrcodes', label: 'QR Codes', icon: QrCode },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ restaurantName }: { restaurantName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/login');
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border w-64">
      <div className="p-6 border-b border-border">
        <div className="text-lg font-bold text-foreground">🍽️ DineAI</div>
        {restaurantName && (
          <div className="text-sm text-muted-foreground mt-1 truncate">{restaurantName}</div>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
