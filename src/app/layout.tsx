import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { TenureProvider } from '@/context/TenureContext';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', weight: ['400', '500', '600', '700', '800', '900'] });

export const metadata: Metadata = {
  title: 'Kaziranga House RHINOS — Inter-House Event Arena',
  description: 'Official event registration and management portal for Kaziranga House students. Home of the RHINOS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${outfit.variable}`}>
      <body className={`${inter.className} min-h-screen bg-arena-bg dark:bg-kaziranga-950 text-rhino-black dark:text-cream-200 flex flex-col antialiased`}>
        <AuthProvider>
          <TenureProvider>
            <NotificationProvider>
              <RouteGuard>
                <AppShell>
                  {children}
                </AppShell>
              </RouteGuard>
            </NotificationProvider>
          </TenureProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
