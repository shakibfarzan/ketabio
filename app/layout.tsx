import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import { Toaster } from '@/components/ui/sonner';
import ThemeProvider from '@/providers/theme-provider';
import { enUS, faIR } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { Poppins, Vazirmatn } from 'next/font/google';
import { cookies } from 'next/headers';
import React from 'react';
import './globals.css';

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-sans',
});
const vazirMatn = Vazirmatn({ subsets: ['arabic'], variable: '--font-fa' });

export const metadata: Metadata = {
  title: 'Ketabio',
  description: 'Your Smart Digital Library',
  manifest: '/manifest.webmanifest',
};

// The document shell is personalized from the request's locale cookie.
// It must be rendered at request time, rather than prerendered as a shared shell.
export const instant = false;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const locale = store.get('locale')?.value || 'en';
  const isPersian = locale === 'fa';
  const clerkLocale = isPersian ? faIR : enUS;
  return (
    <ClerkProvider localization={clerkLocale}>
      <html
        lang={locale}
        dir={isPersian ? 'rtl' : 'ltr'}
        className={isPersian ? vazirMatn.className : poppins.className}
        suppressHydrationWarning
      >
        <body>
          <NextIntlClientProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <Navbar />
              {children}
              <Footer />
              <Toaster />
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
