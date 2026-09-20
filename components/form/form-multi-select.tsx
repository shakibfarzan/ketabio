import React from 'react';
import { FormProps } from '@/components/form/types';
import { Controller, FieldValues } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import RequiredSign from '@/components/form/required-sign';
import { useLocale } from 'use-intl';
import { isRtl } from '@/constants/locales';
import { Option } from '@/components/form/form-select';
import MultiSelect from '@/components/ui/multi-select';

type Props<T extends FieldValues> = FormProps<T> & {
  placeholder?: string;
  options: Option[];
  className?: string;
  isMultiSelect?: boolean;
};

function FormMultiSelect<T extends FieldValues>({
  options,
  placeholder,
  label,
  name,
  control,
  className,
  isRequired,
  isMultiSelect = true,
}: Props<T>) {
  const locale = useLocale();
  const isPersian = isRtl(locale);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field className={className} orientation="vertical" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>
            {label}
            {isRequired && <RequiredSign />}
          </FieldLabel>
          <MultiSelect
            hidePlaceholderWhenSelected
            value={field.value ?? []}
            onChange={field.onChange}
            placeholder={placeholder}
            maxSelected={isMultiSelect ? undefined : 1}
            inputProps={{ name: field.name, dir: isPersian ? 'rtl' : 'ltr' }}
            options={options.map(({ label, value }) => ({ value, label: label as string }))}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export default FormMultiSelect;
