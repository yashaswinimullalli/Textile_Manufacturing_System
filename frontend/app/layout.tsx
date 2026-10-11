import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
export const metadata: Metadata = {
  title: 'VASTRA — Textile Manufacturing Operations System',
  description: 'Role-based textile factory operations system connecting yarn inventory, production orders, machine events, and downtime tracking.',
};

import { FabricTraceProvider } from '@/context/FabricTraceContext';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex">
        <AuthProvider>
          <FabricTraceProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 p-6 overflow-y-auto">
                {children}
              </main>
            </div>
          </FabricTraceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
