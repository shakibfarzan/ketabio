import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import { Toaster } from '@/components/ui/sonner';
import { isRtl } from '@/constants/locales';
import { getRequestLocale } from '@/lib/request-locale';
import { cn } from '@/lib/utils';
import ThemeProvider from '@/providers/theme-provider';
import { enUS, faIR } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { Poppins, Vazirmatn } from 'next/font/google';
import React from 'react';
import './globals.css';

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  // Latin glyphs only — Poppins renders English/Latin text. It has no
  // Persian glyphs, so Persian characters automatically fall through to Vazirmatn.
  subsets: ['latin', 'latin-ext'],
  variable: '--font-poppins',
});
// Arabic subset only — this is where the Persian glyphs live. Latin text is
// handled by Poppins (listed first in the font stack), so Vazirmatn's Latin
// files are never needed.
//
// Both fonts are loaded unconditionally (never per-locale) so mixed content —
// e.g. a Persian book title shown inside the English UI — always renders each
// script in its own font. See `--font-sans` in globals.css.
const vazirMatn = Vazirmatn({ subsets: ['arabic'], variable: '--font-vazir' });

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
  const locale = await getRequestLocale();
  const isPersian = isRtl(locale);
  const clerkLocale = isPersian ? faIR : enUS;
  return (
    <ClerkProvider localization={clerkLocale}>
      <html
        lang={locale}
        dir={isPersian ? 'rtl' : 'ltr'}
        className={cn(poppins.variable, vazirMatn.variable)}
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
