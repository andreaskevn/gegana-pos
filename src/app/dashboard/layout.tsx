import React from 'react';
import Sidebar from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar />
      <main className="flex flex-1 flex-col p-4 md:p-8 lg:p-10 md:ml-64">
        {children}
      </main>
    </div>
  );
}