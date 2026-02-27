'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Category { id: number; name: string; sort_order: number | null; }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/categories');
    if (res.ok) setCats(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addCategory() {
    if (!newName.trim()) return;
    setLoading(true);
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), sort_order: cats.length }),
    });
    if (res.ok) {
      toast.success('Category added');
      setNewName('');
      load();
    }
    setLoading(false);
  }

  async function deleteCategory(id: number) {
    if (!confirm('Delete category? Items in this category will lose their category.')) return;
    const res = await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success('Deleted');
      load();
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Add New Category</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Category name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
            />
            <Button onClick={addCategory} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {cats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No categories yet</div>
          ) : (
            <div className="divide-y divide-border">
              {cats.map((cat, i) => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="text-sm text-muted-foreground mr-2">{i + 1}.</span>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
