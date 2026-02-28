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

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        <div className="text-muted-foreground text-sm bg-muted/30 border border-border rounded-lg p-6 text-center">
          Failed to load analytics. Please refresh the page.
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="h-8 w-40 bg-muted rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

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
            {data.dailyChats.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.dailyChats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Daily AI Cost (30 days)</CardTitle></CardHeader>
          <CardContent>
            {data.dailyCost.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.dailyCost}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${Number(v).toFixed(3)}`} />
                  <Tooltip formatter={(v: unknown) => `$${Number(v).toFixed(4)}`} />
                  <Line type="monotone" dataKey="cost" stroke="#22C55E" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
