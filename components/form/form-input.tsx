import React from 'react';
import { Controller } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FormProps } from '@/components/form/types';
import RequiredSign from '@/components/form/required-sign';

type Props = FormProps & {
  type?: React.HTMLInputTypeAttribute;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
};

const FormInput: React.FC<Props> = ({
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
}) => {
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
            id={field.name}
            min={isNumber ? min : undefined}
            max={isNumber ? max : undefined}
            step={isNumber ? (step ?? 1) : undefined}
            value={field.value ?? ''}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
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
};

export default FormInput;
