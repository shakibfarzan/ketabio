import { AppError } from '@/lib/errors';
import { getTranslations } from 'next-intl/server';

type SafeActionResult<T> = Promise<{ error: string | null; res?: T | undefined }>;

const safeAction = async <T>(callback: () => Promise<T>): SafeActionResult<T> => {
  const t = await getTranslations('errors');
  try {
    const res = await callback();
    return { res, error: null };
  } catch (e) {
    return { error: t((e as AppError).code) };
  }
};
export default safeAction;
