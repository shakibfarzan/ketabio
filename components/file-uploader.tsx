import * as React from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

type FileUploaderProps = {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: Accept;
  maxSizeMB?: number;
  maxFiles?: number;
};

const FileUploader: React.FC<FileUploaderProps> = ({
  value = [],
  onChange,
  accept,
  maxSizeMB = 5,
  maxFiles,
}) => {
  const t = useTranslations('General');
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: true,
    maxFiles,
    onDrop: (acceptedFiles) => {
      const updatedFiles = [...value, ...acceptedFiles];
      onChange(updatedFiles);
    },
  });

  const removeFile = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed transition
          ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/30 bg-muted/30 hover:bg-muted'
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? t('dropFiles') : t('clickFile')}
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {value.map((file, index) => {
            const isImage = file.type.startsWith('image/');
            const preview = isImage ? URL.createObjectURL(file) : null;

            return (
              <div
                key={index}
                className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border bg-muted/30"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt={file.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-center px-2">
                    <FileIcon className="mb-1 h-6 w-6 text-muted-foreground" />
                    <p className="text-xs font-medium truncate w-full">{file.name}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
