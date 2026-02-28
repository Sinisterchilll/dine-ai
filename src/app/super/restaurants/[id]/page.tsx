'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Edit2, Save, X, ExternalLink } from 'lucide-react';

interface Restaurant {
  id: number; name: string; slug: string; description: string | null;
  logo_emoji: string | null; address: string | null; cuisine_type: string | null;
  currency: string | null; status: string | null;
}
interface Config {
  id: number; ai_personality: string | null; ai_greeting: string | null;
  custom_knowledge: string | null; languages: string | null;
}
interface Admin { id: number; name: string; email: string; }
interface Stats { menuCount: number; tableCount: number; chatCount: number; totalCost: number; }

export default function RestaurantDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [adminList, setAdminList] = useState<Admin[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', logo_emoji: '', address: '', cuisine_type: '', status: '' });

  async function load() {
    const res = await fetch(`/api/super/restaurants/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setRestaurant(data.restaurant);
    setConfig(data.config);
    setAdminList(data.admins || []);
    setStats(data.stats);
    setForm({
      name: data.restaurant.name || '',
      description: data.restaurant.description || '',
      logo_emoji: data.restaurant.logo_emoji || '🍽️',
      address: data.restaurant.address || '',
      cuisine_type: data.restaurant.cuisine_type || '',
      status: data.restaurant.status || 'active',
    });
  }

  useEffect(() => { load(); }, [id]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/super/restaurants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setRestaurant(updated);
      setEditing(false);
      toast.success('Restaurant updated');
    } else {
      toast.error('Failed to save');
    }
    setSaving(false);
  }

  async function toggleStatus() {
    if (!restaurant) return;
    const newStatus = restaurant.status === 'active' ? 'inactive' : 'active';
    const res = await fetch(`/api/super/restaurants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRestaurant(updated);
      setForm(f => ({ ...f, status: newStatus }));
      toast.success(`Restaurant ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } else {
      toast.error('Failed to update status');
    }
  }

  if (!restaurant) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/super/restaurants" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Restaurants
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <span className="text-4xl">{restaurant.logo_emoji}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{restaurant.cuisine_type} • {restaurant.address || 'No address'}</p>
          <div className="flex items-center gap-3 mt-2">
            <code className="text-xs text-muted-foreground">/r/{restaurant.slug}</code>
            <Link href={`/r/${restaurant.slug}`} target="_blank" className="text-xs text-amber-400 flex items-center gap-1 hover:underline">
              <ExternalLink className="h-3 w-3" /> Open chat
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={restaurant.status === 'active' ? 'default' : 'secondary'}>
            {restaurant.status}
          </Badge>
          <Button
            variant="outline" size="sm"
            onClick={toggleStatus}
            className={restaurant.status === 'active' ? 'text-destructive' : 'text-green-500'}
          >
            {restaurant.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          {!editing ? (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Menu Items', value: stats.menuCount },
            { label: 'Tables', value: stats.tableCount },
            { label: 'Total Chats', value: stats.chatCount },
            { label: 'AI Cost', value: `$${stats.totalCost.toFixed(4)}` },
          ].map(s => (
            <Card key={s.label}>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{s.label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{s.value}</div></CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Restaurant Details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Restaurant Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label>Emoji</Label>
                    <Input value={form.logo_emoji} onChange={e => setForm(f => ({ ...f, logo_emoji: e.target.value }))} className="text-center text-xl" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>Cuisine Type</Label>
                  <Input value={form.cuisine_type} onChange={e => setForm(f => ({ ...f, cuisine_type: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {restaurant.name}</div>
                {restaurant.description && <div><span className="text-muted-foreground">Description:</span> {restaurant.description}</div>}
                <div><span className="text-muted-foreground">Cuisine:</span> {restaurant.cuisine_type || '—'}</div>
                <div><span className="text-muted-foreground">Address:</span> {restaurant.address || '—'}</div>
                <div><span className="text-muted-foreground">Currency:</span> {restaurant.currency || 'INR'}</div>
                <div><span className="text-muted-foreground">Status:</span> {restaurant.status}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Admin Accounts */}
          <Card>
            <CardHeader><CardTitle className="text-base">Admin Accounts</CardTitle></CardHeader>
            <CardContent>
              {adminList.length === 0 ? (
                <p className="text-muted-foreground text-sm">No admins</p>
              ) : (
                <div className="space-y-3">
                  {adminList.map(a => (
                    <div key={a.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Config */}
          <Card>
            <CardHeader><CardTitle className="text-base">AI Config</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Personality:</span> {config?.ai_personality || 'friendly'}</div>
              <div><span className="text-muted-foreground">Languages:</span> {config?.languages ? JSON.parse(config.languages).join(', ') : 'English'}</div>
              {config?.ai_greeting && (
                <div>
                  <div className="text-muted-foreground mb-1">Greeting:</div>
                  <div className="text-xs italic text-muted-foreground bg-muted rounded p-2">{config.ai_greeting}</div>
                </div>
              )}
              <p className="text-xs text-muted-foreground pt-1">The restaurant admin can edit their AI config from Settings.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
