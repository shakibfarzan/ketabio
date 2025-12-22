import type { Metadata } from 'next';
import { Poppins, Vazirmatn } from 'next/font/google';
import './globals.css';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import Navbar from '@/components/navbar';
import ThemeProvider from '@/components/theme-provider';

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-sans',
});
const vazirMatn = Vazirmatn({ subsets: ['arabic'], variable: '--font-fa' });

export const metadata: Metadata = {
  title: 'Ketabio',
  description: 'Your Smart Digital Library',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const locale = store.get('locale')?.value || 'en';
  const isPersian = locale === 'fa';
  return (
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
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
