'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  veg: boolean | null;
  spice_level: number | null;
  is_popular: boolean | null;
  is_chef_special: boolean | null;
  is_today_special: boolean | null;
  in_stock: boolean | null;
  category_name: string | null;
}

const SPICE = ['', '🌶', '🌶🌶', '🌶🌶🌶'];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    const res = await fetch('/api/admin/menu');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadItems(); }, []);

  async function toggleField(id: number, field: string, value: boolean) {
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
      toast.success('Updated');
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems(items.filter(i => i.id !== id));
      toast.success('Deleted');
    }
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.category_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category_name || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <Link href="/admin/menu/new">
          <Button><Plus className="h-4 w-4 mr-2" />Add Item</Button>
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{cat}</h2>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${item.veg ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {item.veg ? 'VEG' : 'NON-VEG'}
                        </span>
                        {item.spice_level ? <span>{SPICE[item.spice_level]}</span> : null}
                        {item.is_popular && <Badge variant="secondary">Popular</Badge>}
                        {item.is_chef_special && <Badge variant="outline">Chef&apos;s Special</Badge>}
                        {item.is_today_special && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Today&apos;s Special</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">{formatCurrency(item.price)}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Special</span>
                        <Switch
                          checked={item.is_today_special || false}
                          onCheckedChange={v => toggleField(item.id, 'is_today_special', v)}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>In Stock</span>
                        <Switch
                          checked={item.in_stock || false}
                          onCheckedChange={v => toggleField(item.id, 'in_stock', v)}
                        />
                      </div>
                      <Link href={`/admin/menu/${item.id}`}>
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
