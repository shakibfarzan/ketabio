import { getRequestConfig } from 'next-intl/server';
import { getRequestLocale } from '@/lib/request-locale';

/**
 * next-intl request config: static UI copy for the current locale.
 *
 * The locale comes from the same helper the database layer uses (`lib/request-locale.ts`), so the
 * UI language and the language dynamic content is read in are always the same.
 */
export default getRequestConfig(async () => {
  const locale = await getRequestLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
