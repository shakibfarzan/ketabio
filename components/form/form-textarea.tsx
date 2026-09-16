import React from 'react';
import { FormProps } from '@/components/form/types';
import { Controller, FieldValues } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import RequiredSign from '@/components/form/required-sign';

type Props<T extends FieldValues> = FormProps<T> & {
  placeholder?: string;
  className?: string;
  fieldDescription?: string;
};

function FormTextarea<T extends FieldValues>({
  className,
  name,
  fieldDescription,
  label,
  placeholder,
  control,
  isRequired,
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field className={className} data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>
            {label}
            {isRequired && <RequiredSign />}
          </FieldLabel>
          <Textarea
            {...field}
            id={field.name}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
            value={field.value ?? ''}
          />
          {fieldDescription && <FieldDescription>{fieldDescription}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export default FormTextarea;
