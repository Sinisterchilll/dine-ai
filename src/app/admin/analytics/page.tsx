'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Analytics {
  totalChats: number;
  todayChats: number;
  totalTokens: number;
  totalCost: number;
  totalOrders: number;
  totalRevenue: number;
  dailyChats: { date: string; count: number }[];
  dailyCost: { date: string; cost: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="p-8 text-muted-foreground">Loading analytics...</div>;

  const stats = [
    { title: "Today's Chats", value: data.todayChats },
    { title: 'Total Chats', value: data.totalChats },
    { title: 'Total Tokens', value: data.totalTokens.toLocaleString() },
    { title: 'AI Cost', value: `$${data.totalCost.toFixed(4)}` },
    { title: 'Total Orders', value: data.totalOrders },
    { title: 'Total Revenue', value: `₹${data.totalRevenue.toFixed(0)}` },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Chats (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.dailyChats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Daily AI Cost (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.dailyCost}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${Number(v).toFixed(3)}`} />
                <Tooltip formatter={(v: unknown) => `$${Number(v).toFixed(4)}`} />
                <Line type="monotone" dataKey="cost" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
