import { Controller } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { FormProps } from '@/components/form/types';
import React from 'react';
import FileUploader from '@/components/file-uploader';
import { Accept } from 'react-dropzone';

type Props = FormProps & {
  accept?: Accept;
  maxSizeMB?: number;
};

const FormFileUploader: React.FC<Props> = ({ name, label, control, accept, maxSizeMB }) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>

          <FileUploader
            value={field.value}
            onChange={field.onChange}
            accept={accept}
            maxSizeMB={maxSizeMB}
          />

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default FormFileUploader;
