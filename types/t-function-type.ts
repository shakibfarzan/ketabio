import { getTranslations } from 'next-intl/server';

export type TFunctionType = Awaited<ReturnType<typeof getTranslations>>;
