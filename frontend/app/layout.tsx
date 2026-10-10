import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'FabricTrace — Textile Manufacturing Operations System',
  description: 'Role-based textile factory operations system connecting yarn inventory, production orders, machine events, and downtime tracking.',
};

import { FabricTraceProvider } from '@/context/FabricTraceContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex">
        <FabricTraceProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 overflow-y-auto">
              {children}
            </main>
          </div>
        </FabricTraceProvider>
      </body>
    </html>
  );
}
