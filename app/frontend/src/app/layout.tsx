import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChainCred - Blockchain Credential Verification',
  description:
    'Secure, transparent, and tamper-proof credential verification powered by blockchain technology',
  keywords: [
    'blockchain',
    'credentials',
    'verification',
    'certificates',
    'education',
    'polygon',
  ],
  authors: [{ name: 'ChainCred Team' }],
  openGraph: {
    title: 'ChainCred - Blockchain Credential Verification',
    description: 'Secure, transparent, and tamper-proof credential verification',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
