'use client';

import { isErrorMessageKey, type ErrorMessageKey } from '@/lib/errors/error-codes';
import type { ActionError } from '@/types/action-result';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

/**
 * Translates server error codes (`errors` namespace).
 *
 * Only known codes are passed to next-intl (see `isErrorMessageKey`); anything else falls back
 * to `INTERNAL_ERROR` so arbitrary strings can never be used as translation keys.
 */
const useErrorMessage = () => {
  const t = useTranslations('errors');

  const translate = useCallback(
    (code: ErrorMessageKey | string) => t(isErrorMessageKey(code) ? code : 'INTERNAL_ERROR'),
    [t]
  );

  /**
   * Splits an `ActionError` into what belongs to inputs and what belongs to a toast.
   * Field errors are translated per field; the summary is used when there are none.
   */
  const describe = useCallback(
    (error: ActionError) => {
      const fields = Object.entries(error.fields ?? {}).map(
        ([field, code]) => [field, translate(code)] as const
      );
      return { fields, summary: translate(error.code) };
    },
    [translate]
  );

  return { translate, describe };
};

export default useErrorMessage;
