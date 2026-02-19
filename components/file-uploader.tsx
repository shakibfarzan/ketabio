import * as React from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

type FileUploaderProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: Accept;
  maxSizeMB?: number;
};

const FileUploader: React.FC<FileUploaderProps> = ({ value, onChange, accept, maxSizeMB = 5 }) => {
  const t = useTranslations('General');
  const file = value;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    onDrop: (acceptedFiles) => {
      onChange(acceptedFiles[0] ?? null);
    },
  });

  const isImage = file?.type.startsWith('image/');
  const preview = isImage && file ? URL.createObjectURL(file) : null;

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!file) {
    return (
      <div
        {...getRootProps()}
        className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed transition
          ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/30 bg-muted/30 hover:bg-muted'
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('clickFile')}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="preview" className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center text-center">
          <FileIcon className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition hover:opacity-100">
        <Button size="sm" variant="secondary" type="button" onClick={() => onChange(null)}>
          {t('change')}
        </Button>

        <Button size="sm" variant="destructive" type="button" onClick={() => onChange(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
