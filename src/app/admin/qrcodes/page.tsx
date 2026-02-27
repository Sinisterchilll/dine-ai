'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Download, Trash2 } from 'lucide-react';

interface Table { id: number; table_number: number; label: string | null; }

export default function QRCodesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [newNumber, setNewNumber] = useState('');
  const [newLabel, setNewLabel] = useState('');

  async function load() {
    const res = await fetch('/api/admin/tables');
    if (res.ok) setTables(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addTable() {
    if (!newNumber) return;
    const res = await fetch('/api/admin/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number: parseInt(newNumber), label: newLabel || null }),
    });
    if (res.ok) {
      toast.success('Table added');
      setNewNumber('');
      setNewLabel('');
      load();
    }
  }

  async function deleteTable(id: number) {
    if (!confirm('Delete this table?')) return;
    const res = await fetch('/api/admin/tables', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success('Deleted');
      load();
    }
  }

  function downloadQR(tableId: number, tableNumber: number) {
    const a = document.createElement('a');
    a.href = `/api/admin/qr/${tableId}`;
    a.download = `table-${tableNumber}-qr.png`;
    a.click();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">QR Codes</h1>
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Add Table</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Table #"
              value={newNumber}
              onChange={e => setNewNumber(e.target.value)}
              className="w-32"
            />
            <Input
              placeholder="Label (e.g. Window Seat)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
            />
            <Button onClick={addTable}>
              <Plus className="h-4 w-4 mr-2" />Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map(table => (
          <Card key={table.id} className="flex flex-col">
            <CardContent className="p-4 flex flex-col items-center gap-3">
              <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/qr/${table.id}`}
                  alt={`QR for Table ${table.table_number}`}
                  className="w-28 h-28"
                />
              </div>
              <div className="text-center">
                <div className="font-semibold">Table {table.table_number}</div>
                {table.label && <div className="text-xs text-muted-foreground">{table.label}</div>}
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => downloadQR(table.id, table.table_number)}
                >
                  <Download className="h-3 w-3 mr-1" />Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTable(table.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
