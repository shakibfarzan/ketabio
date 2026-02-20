import React from 'react';
import { FormProps } from '@/components/form/types';
import { Controller } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RequiredSign from '@/components/form/required-sign';
import { useLocale } from 'use-intl';

type Option = {
  label: string | ((value: string) => React.ReactNode);
  value: string;
};

type Props = FormProps & {
  placeholder?: string;
  options: Option[];
  className?: string;
};

const FormSelect: React.FC<Props> = ({
  options,
  placeholder,
  label,
  name,
  control,
  className,
  isRequired,
}) => {
  const locale = useLocale();
  const isPersian = locale === 'fa';
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field orientation="vertical" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>
            {label}
            {isRequired && <RequiredSign />}
          </FieldLabel>
          <Select
            dir={isPersian ? 'rtl' : 'ltr'}
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
          >
            <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className={className}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent position="item-aligned">
              {options.map(({ label: opLabel, value }) => (
                <SelectItem value={value} key={value}>
                  {typeof opLabel === 'function' ? opLabel(value) : opLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default FormSelect;
