import { Sidebar } from '@/components/dashboard/sidebar';
import { Chat } from '@/components/dashboard/chat';
import { DashboardBreadcrumbs } from '@/components/dashboard/breadcrumbs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden text-text transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 pt-[4.5rem] pb-24 lg:p-7 lg:pt-7 lg:pb-7">
          <DashboardBreadcrumbs />
          {children}
        </div>
      </main>
      <Chat />
    </div>
  );
}
