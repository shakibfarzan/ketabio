import { TFunctionType } from '@/types/t-function-type';
import z from 'zod';

export const categorySchema = (tForms: TFunctionType) =>
  z.object({
    name: z.string().trim().min(2, tForms('minLength')).max(100, tForms('maxLength100')),
  });
