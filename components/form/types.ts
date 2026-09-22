import { ReactNode } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

export type FormProps<T extends FieldValues> = {
  name: Path<T>;
  label: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<T, any, T>;
  isRequired?: boolean;
};
