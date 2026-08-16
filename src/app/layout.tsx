import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { DemoRoleSwitcher } from '@/components/layout/DemoRoleSwitcher';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kaziranga House - Inter-House Event Portal',
  description: 'Official event registration and management portal for Kaziranga House students.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50 dark:bg-kaziranga-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-kaziranga-700 selection:text-white`}>
        <AuthProvider>
          <NotificationProvider>
            <RouteGuard>
              <DemoRoleSwitcher />
              <Navbar />
              <div className="flex-1 flex w-full max-w-full">
                <Sidebar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 overflow-y-auto">
                  {children}
                </main>
              </div>
              <BottomNav />
            </RouteGuard>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
