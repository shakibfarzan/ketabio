import { Control, FieldValues } from 'react-hook-form';

export type FormProps = {
  name: string;
  label: string;
  control?: Control<FieldValues, any, FieldValues>;
  isRequired?: boolean;
};
