import { Control, FieldValues } from 'react-hook-form';

export type FormProps = {
  name: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: Control<FieldValues, any, FieldValues>;
  isRequired?: boolean;
};
