import React from 'react';
import { FormProps } from '@/components/form/types';
import { Controller } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import RequiredSign from '@/components/form/required-sign';

type Props = FormProps & {
  placeholder?: string;
  className?: string;
  fieldDescription?: string;
};

const FormTextarea: React.FC<Props> = ({
  className,
  name,
  fieldDescription,
  label,
  placeholder,
  control,
  isRequired,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>
            {label}
            {isRequired && <RequiredSign />}
          </FieldLabel>
          <Textarea
            {...field}
            id={field.name}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
            className={className}
          />
          {fieldDescription && <FieldDescription>{fieldDescription}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default FormTextarea;
