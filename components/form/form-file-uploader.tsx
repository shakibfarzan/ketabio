import { Controller } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { FormProps } from '@/components/form/types';
import { Accept } from 'react-dropzone';
import React from 'react';
import FileUploader from '@/components/file-uploader';

type Props = FormProps & {
  accept?: Accept;
  maxSizeMB?: number;
  maxFiles?: number;
  labelClassName?: string;
};

const FormFileUploader: React.FC<Props> = ({
  name,
  label,
  control,
  accept,
  maxSizeMB,
  maxFiles,
  labelClassName = '',
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel className={labelClassName}>{label}</FieldLabel>

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
};

export default FormFileUploader;
