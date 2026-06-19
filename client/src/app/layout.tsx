import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import ToastContainer from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SyncRoom — Watch Together',
  description: 'Watch YouTube, share screens, chat, and voice call — all in sync with friends. No sign-up required.',
  keywords: ['watch party', 'watch together', 'youtube sync', 'screen share', 'voice chat'],
  openGraph: {
    title: 'SyncRoom — Watch Together',
    description: 'Watch YouTube, share screens, chat, and voice call — all in sync with friends.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-bg-primary text-text-primary`}>
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
