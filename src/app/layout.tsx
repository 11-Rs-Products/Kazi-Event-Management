import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', weight: ['400', '500', '600', '700', '800', '900'] });

export const metadata: Metadata = {
  title: 'Kaziranga House RHINOS — Intra-House Event Arena',
  description: 'Official event registration and management portal for Kaziranga House students. Home of the RHINOS.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#050D0B' },
    { media: '(prefers-color-scheme: dark)', color: '#050D0B' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Applies the stored theme before first paint so the page never
          flashes light before switching to dark.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('kazi-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-3 focus:left-3
            focus:px-4 focus:py-2 focus:rounded-xl focus:bg-brand focus:text-brand-contrast focus:font-semibold"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
