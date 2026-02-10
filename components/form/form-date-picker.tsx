import * as React from 'react';
import { Controller } from 'react-hook-form';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormProps } from '@/components/form/types';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

type Props = FormProps & {
  placeholder?: string;
};

const FormDatePicker: React.FC<Props> = ({ name, label, control, placeholder }) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id={field.name}
                aria-invalid={fieldState.invalid}
                className="w-full justify-start text-left font-normal"
              >
                {field.value ? (
                  format(field.value, 'PPP')
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ?? undefined}
                onSelect={field.onChange}
                autoFocus
              />
            </PopoverContent>
          </Popover>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default FormDatePicker;
