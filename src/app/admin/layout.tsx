export const dynamic = 'force-dynamic';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { restaurants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'restaurant') redirect('/login');

  let restaurantName = '';
  if (user.restaurantId) {
    const [r] = await db.select({ name: restaurants.name }).from(restaurants).where(eq(restaurants.id, user.restaurantId));
    restaurantName = r?.name || '';
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar restaurantName={restaurantName} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
