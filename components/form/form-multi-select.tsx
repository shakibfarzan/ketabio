import React from 'react';
import { FormProps } from '@/components/form/types';
import { Controller } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import RequiredSign from '@/components/form/required-sign';
import { useLocale } from 'use-intl';
import { Option } from '@/components/form/form-select';
import MultiSelect from '@/components/ui/multi-select';

type Props = FormProps & {
  placeholder?: string;
  options: Option[];
  className?: string;
  isMultiSelect?: boolean;
};

const FormMultiSelect: React.FC<Props> = ({
  options,
  placeholder,
  label,
  name,
  control,
  className,
  isRequired,
  isMultiSelect = true,
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
          <MultiSelect
            hidePlaceholderWhenSelected
            className={className}
            value={field.value}
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
};

export default FormMultiSelect;
