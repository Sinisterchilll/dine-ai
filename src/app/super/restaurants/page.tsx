'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

interface Restaurant {
  id: number; name: string; slug: string; logo_emoji: string | null;
  cuisine_type: string | null; status: string | null;
  chatCount: number; totalCost: number; menuCount: number;
}

export default function SuperRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', logo_emoji: '🍽️', address: '', cuisine_type: '',
    admin_email: '', admin_name: '', admin_password: 'password123',
  });

  async function load() {
    const res = await fetch('/api/super/restaurants');
    if (res.ok) setRestaurants(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function createRestaurant(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/super/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success('Restaurant created');
      setOpen(false);
      setForm({ name: '', description: '', logo_emoji: '🍽️', address: '', cuisine_type: '', admin_email: '', admin_name: '', admin_password: 'password123' });
      load();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed');
    }
    setLoading(false);
  }

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.cuisine_type || '').toLowerCase().includes(search.toLowerCase())
  );

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Restaurants</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Restaurant</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Restaurant</DialogTitle>
            </DialogHeader>
            <form onSubmit={createRestaurant} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Emoji</Label>
                  <Input value={form.logo_emoji} onChange={e => set('logo_emoji', e.target.value)} />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Cuisine Type</Label>
                  <Input value={form.cuisine_type} onChange={e => set('cuisine_type', e.target.value)} placeholder="e.g. Indian" />
                </div>
                <div className="space-y-1">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3 text-muted-foreground">Admin Account</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Admin Name *</Label>
                    <Input value={form.admin_name} onChange={e => set('admin_name', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Admin Email *</Label>
                    <Input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input value={form.admin_password} onChange={e => set('admin_password', e.target.value)} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Restaurant'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search restaurants..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map(r => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{r.logo_emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/super/restaurants/${r.id}`} className="font-semibold hover:underline">{r.name}</Link>
                      <Badge variant={r.status === 'active' ? 'default' : 'secondary'}>{r.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{r.cuisine_type} • slug: {r.slug}</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-muted-foreground">{r.chatCount} chats</div>
                  <div className="text-muted-foreground">{r.menuCount} items</div>
                  <div className="text-xs text-amber-400">${r.totalCost.toFixed(4)} AI cost</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
