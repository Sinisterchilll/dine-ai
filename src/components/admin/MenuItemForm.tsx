'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface Category { id: number; name: string; }

export default function MenuItemForm({ itemId }: { itemId?: string }) {
  const router = useRouter();
  const isEdit = !!itemId && itemId !== 'new';
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    name: '', description: '', price: '', category_id: '',
    veg: true, spice_level: '0', calories: '',
    allergens: '', is_popular: false, is_chef_special: false,
    is_today_special: false, in_stock: true,
  });

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories);
    if (isEdit) {
      fetch(`/api/admin/menu/${itemId}`).then(r => r.json()).then(data => {
        setForm({
          name: data.name || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          category_id: data.category_id?.toString() || '',
          veg: data.veg ?? true,
          spice_level: data.spice_level?.toString() || '0',
          calories: data.calories?.toString() || '',
          allergens: JSON.parse(data.allergens || '[]').join(', '),
          is_popular: data.is_popular || false,
          is_chef_special: data.is_chef_special || false,
          is_today_special: data.is_today_special || false,
          in_stock: data.in_stock ?? true,
        });
      });
    }
  }, [isEdit, itemId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = {
      ...form,
      price: parseFloat(form.price),
      category_id: parseInt(form.category_id),
      spice_level: parseInt(form.spice_level),
      calories: form.calories ? parseInt(form.calories) : null,
      allergens: form.allergens.split(',').map(s => s.trim()).filter(Boolean),
    };
    const url = isEdit ? `/api/admin/menu/${itemId}` : '/api/admin/menu';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success(isEdit ? 'Item updated' : 'Item created');
      router.push('/admin/menu');
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed');
    }
    setLoading(false);
  }

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Item' : 'Add Menu Item'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category_id} onValueChange={v => set('category_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dietary & Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Spice Level</Label>
                <Select value={form.spice_level} onValueChange={v => set('spice_level', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Not Spicy</SelectItem>
                    <SelectItem value="1">Mild 🌶</SelectItem>
                    <SelectItem value="2">Medium 🌶🌶</SelectItem>
                    <SelectItem value="3">Spicy 🌶🌶🌶</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calories</Label>
                <Input type="number" value={form.calories} onChange={e => set('calories', e.target.value)} placeholder="e.g. 350" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Allergens (comma separated)</Label>
              <Input value={form.allergens} onChange={e => set('allergens', e.target.value)} placeholder="dairy, gluten, nuts" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.veg} onCheckedChange={v => set('veg', v)} />
              <Label>{form.veg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Flags</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { field: 'in_stock', label: 'In Stock' },
              { field: 'is_popular', label: 'Popular' },
              { field: 'is_chef_special', label: "Chef's Special" },
              { field: 'is_today_special', label: "Today's Special" },
            ].map(({ field, label }) => (
              <div key={field} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch
                  checked={form[field as keyof typeof form] as boolean}
                  onCheckedChange={v => set(field, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Item'}</Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/menu')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
