'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Store, BarChart3, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
  { href: '/super/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super/restaurants', label: 'Restaurants', icon: Store },
  { href: '/super/analytics', label: 'Analytics', icon: BarChart3 },
];

export function SuperSidebar() {
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
        <div className="text-xs text-amber-400 mt-1 font-medium">Super Admin</div>
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
