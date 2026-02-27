export const dynamic = 'force-dynamic';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SuperSidebar } from '@/components/super/Sidebar';

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'super') redirect('/login');

  return (
    <div className="flex h-screen bg-background">
      <SuperSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
