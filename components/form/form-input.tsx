import RequiredSign from '@/components/form/required-sign';
import { FormProps } from '@/components/form/types';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import React from 'react';
import { Controller, FieldValues } from 'react-hook-form';

type Props<T extends FieldValues> = FormProps<T> & {
  type?: React.HTMLInputTypeAttribute;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  /** Text direction of the field itself — Persian inputs stay RTL inside an LTR form. */
  dir?: 'rtl' | 'ltr';
  inputClassName?: string;
};

function FormInput<T extends FieldValues>({
  name,
  label,
  type,
  control,
  min,
  max,
  step,
  placeholder,
  isRequired,
  className = '',
  dir,
  inputClassName = '',
}: Props<T>) {
  const isNumber = type === 'number';
  return (
    <Controller
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={field.name}>
            {label}
            {isRequired && <RequiredSign />}
          </FieldLabel>
          <Input
            {...field}
            type={type}
            dir={dir}
            id={field.name}
            min={isNumber ? min : undefined}
            max={isNumber ? max : undefined}
            step={isNumber ? (step ?? 1) : undefined}
            value={field.value ?? ''}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
            className={inputClassName}
            onChange={(e) => {
              if (!isNumber) {
                field.onChange(e);
                return;
              }

              const value = e.target.valueAsNumber;
              field.onChange(Number.isNaN(value) ? null : value);
            }}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
      name={name}
    />
  );
}

export default FormInput;
