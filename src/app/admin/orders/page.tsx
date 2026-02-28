'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface CartItem { id: number; name: string; price: number; qty: number; }

interface Order {
  id: number;
  items: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string | null;
  created_at: string | null;
  table_label: string | null;
  table_number: number | null;
  customer_name: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  preparing: 'bg-blue-500/20 text-blue-400',
  ready: 'bg-green-500/20 text-green-400',
  delivered: 'bg-gray-500/20 text-gray-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        setOrders(await res.json());
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: number, status: string) {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        toast.success('Status updated');
      } else {
        toast.error('Failed to update status');
        load(); // Reload to revert
      }
    } catch {
      toast.error('Network error');
      load();
    }
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status || ''));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status || ''));

  function OrderCard({ order }: { order: Order }) {
    let items: CartItem[] = [];
    try { items = JSON.parse(order.items); } catch {}
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-semibold text-sm">Order #{order.id}</span>
                {order.table_number && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    Table {order.table_number}{order.table_label ? ` — ${order.table_label}` : ''}
                  </span>
                )}
                {order.customer_name && (
                  <span className="text-xs text-muted-foreground">{order.customer_name}</span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} × {item.qty}</span>
                    <span>{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-xs text-muted-foreground">
                  Subtotal {formatCurrency(order.subtotal)} + GST {formatCurrency(order.tax)}
                </span>
                <span className="font-bold text-amber-400">{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status || 'pending'] || ''}`}>
                {order.status || 'pending'}
              </span>
              <Select value={order.status || 'pending'} onValueChange={v => updateStatus(order.id, v)}>
                <SelectTrigger className="w-32 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <span className="text-sm text-muted-foreground">Auto-refreshes every 30s</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-3">Failed to load orders.</p>
          <Button variant="outline" onClick={load}>Try again</Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">📋</div>
          <p>No orders yet. Orders placed via the customer chat will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeOrders.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-muted-foreground mb-3">
                Active ({activeOrders.length})
              </h2>
              <div className="space-y-3">
                {activeOrders.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}
          {pastOrders.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-muted-foreground mb-3">
                Completed / Cancelled ({pastOrders.length})
              </h2>
              <div className="space-y-3 opacity-60">
                {pastOrders.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
