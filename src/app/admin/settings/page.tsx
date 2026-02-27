'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', logo_emoji: '', address: '', cuisine_type: '', currency: 'INR',
    ai_personality: 'friendly', ai_greeting: '', custom_knowledge: '', languages: '',
  });

  useEffect(() => {
    fetch('/api/admin/restaurant').then(r => r.json()).then(({ restaurant, config }) => {
      setForm({
        name: restaurant?.name || '',
        description: restaurant?.description || '',
        logo_emoji: restaurant?.logo_emoji || '🍽️',
        address: restaurant?.address || '',
        cuisine_type: restaurant?.cuisine_type || '',
        currency: restaurant?.currency || 'INR',
        ai_personality: config?.ai_personality || 'friendly',
        ai_greeting: config?.ai_greeting || '',
        custom_knowledge: config?.custom_knowledge || '',
        languages: config?.languages ? JSON.parse(config.languages).join(', ') : 'English',
      });
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/restaurant', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
      }),
    });
    if (res.ok) toast.success('Settings saved');
    else toast.error('Failed to save');
    setLoading(false);
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Restaurant Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Emoji</Label>
                <Input value={form.logo_emoji} onChange={e => set('logo_emoji', e.target.value)} />
              </div>
              <div className="col-span-3 space-y-2">
                <Label>Restaurant Name</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cuisine Type</Label>
                <Input value={form.cuisine_type} onChange={e => set('cuisine_type', e.target.value)} placeholder="e.g. Indian" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => set('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">AI Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Personality</Label>
              <Select value={form.ai_personality} onValueChange={v => set('ai_personality', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly & Warm</SelectItem>
                  <SelectItem value="formal">Formal & Professional</SelectItem>
                  <SelectItem value="witty">Witty & Playful</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>AI Greeting</Label>
              <Textarea value={form.ai_greeting} onChange={e => set('ai_greeting', e.target.value)} rows={2} placeholder="Welcome message for customers..." />
            </div>
            <div className="space-y-2">
              <Label>Custom Knowledge</Label>
              <Textarea value={form.custom_knowledge} onChange={e => set('custom_knowledge', e.target.value)} rows={4} placeholder="Special facts about your restaurant, sourcing info, policies..." />
            </div>
            <div className="space-y-2">
              <Label>Supported Languages (comma separated)</Label>
              <Input value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="English, Hindi, Tamil" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Settings'}</Button>
      </form>
    </div>
  );
}
