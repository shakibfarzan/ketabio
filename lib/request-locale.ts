import { LOCALE_COOKIE, DEFAULT_LOCALE, isLocale, type Locale } from '@/constants/locales';
import { cookies } from 'next/headers';

/**
 * Server-side: resolves the locale of the current request from the `locale` cookie.
 *
 * This is the only place that reads the cookie for data purposes — `i18n/request.ts` (next-intl)
 * and `app/layout.tsx` use it too, so the UI language and the database language can never diverge.
 * Unknown or missing values fall back to `DEFAULT_LOCALE`.
 *
 * Server-only (`next/headers`). Call it in a Server Component / Server Action and pass the result
 * down to the repository — `db/*` never reads the request itself.
 */
export const getRequestLocale = async (): Promise<Locale> => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
};
