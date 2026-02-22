import type { Metadata } from 'next';
import { Poppins, Vazirmatn } from 'next/font/google';
import './globals.css';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import Navbar from '@/components/navbar';
import ThemeProvider from '@/providers/theme-provider';
import Footer from '@/components/footer';
import { ClerkProvider } from '@clerk/nextjs';
import { enUS, faIR } from '@clerk/localizations';
import { getOrCreateUser } from '@/utils/auth';
import { ROLES } from '@/db/schema';

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
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
