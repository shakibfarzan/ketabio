import * as React from 'react';
import { Controller } from 'react-hook-form';
import { Upload, X } from 'lucide-react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { FormProps } from '@/components/form/types';
import { useTranslations } from 'next-intl';

type Props = FormProps & {
  accept?: string;
  maxSizeMB?: number;
};

const FormImageUploader: React.FC<Props> = ({
  name,
  label,
  control,
  accept = 'image/*',
  maxSizeMB = 5,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const t = useTranslations('General');

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const file: File | null = field.value;
        const preview = file ? URL.createObjectURL(file) : null;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{label}</FieldLabel>

            <input
              ref={inputRef}
              type="file"
              accept={accept}
              hidden
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (!selected) return;

                if (selected.size > maxSizeMB * 1024 * 1024) {
                  field.onChange(null);
                  return;
                }

                field.onChange(selected);
              }}
            />

            {/* Upload area */}
            {!preview ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 transition hover:bg-muted"
              >
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click or drag image to upload</p>
              </button>
            ) : (
              <div className="relative h-40 w-full overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />

                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition hover:opacity-100">
                  <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                    Change
                  </Button>

                  <Button size="sm" variant="destructive" onClick={() => field.onChange(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

export default FormImageUploader;
