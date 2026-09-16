import FileUploader from '@/components/file-uploader';
import RequiredSign from '@/components/form/required-sign';
import { FormProps } from '@/components/form/types';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Accept } from 'react-dropzone';
import { Controller, FieldValues } from 'react-hook-form';

type Props<T extends FieldValues> = FormProps<T> & {
  accept?: Accept;
  maxSizeMB?: number;
  maxFiles?: number;
  labelClassName?: string;
  className?: string;
};

function FormFileUploader<T extends FieldValues>({
  name,
  label,
  control,
  accept,
  maxSizeMB,
  maxFiles,
  labelClassName = '',
  className,
  isRequired,
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field className={className} data-invalid={fieldState.invalid}>
          <FieldLabel className={labelClassName}>
            {label}
            {isRequired && <RequiredSign />}
          </FieldLabel>

          <FileUploader
            value={field.value || []}
            onChange={field.onChange}
            accept={accept}
            maxSizeMB={maxSizeMB}
            maxFiles={maxFiles}
          />

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export default FormFileUploader;
