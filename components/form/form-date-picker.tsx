'use client';
import { format } from 'date-fns';
import { faIR } from 'react-day-picker/locale';
import { Controller, FieldValues } from 'react-hook-form';

import { FormProps } from '@/components/form/types';
import RequiredSign from '@/components/form/required-sign';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocale } from 'use-intl';

type Props<T extends FieldValues> = FormProps<T> & {
  placeholder?: string;
  className?: string;
};

function FormDatePicker<T extends FieldValues>({
  name,
  label,
  control,
  placeholder,
  className,
  isRequired,
}: Props<T>) {
  const locale = useLocale();
  const isPersian = locale === 'fa';
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id={field.name}
                aria-invalid={fieldState.invalid}
                className="w-full justify-start text-left overflow-hidden font-normal bg-transparent"
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
                locale={isPersian ? faIR : undefined}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export default FormDatePicker;
