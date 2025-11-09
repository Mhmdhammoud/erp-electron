import { useRef, useState, forwardRef } from 'react';
import { Upload, X, ImageIcon, FileIcon, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';

/**
 * Supported file types
 */
export type FileType =
  | 'image'
  | 'document'
  | 'video'
  | 'all';

/**
 * Get accept attribute based on file type
 */
const getAcceptType = (fileType: FileType): string => {
  switch (fileType) {
    case 'image':
      return 'image/png,image/jpeg,image/jpg,image/webp,image/gif';
    case 'document':
      return 'application/pdf,.doc,.docx,.txt';
    case 'video':
      return 'video/mp4,video/webm';
    case 'all':
    default:
      return '*';
  }
};

/**
 * Get file type description
 */
const getFileTypeDescription = (fileType: FileType): string => {
  switch (fileType) {
    case 'image':
      return 'PNG, JPG, WEBP, GIF up to 5MB';
    case 'document':
      return 'PDF, DOC, DOCX up to 5MB';
    case 'video':
      return 'MP4, WEBM up to 5MB';
    case 'all':
    default:
      return 'Any file up to 5MB';
  }
};

interface FileUploaderProps {
  /**
   * Unique identifier for the uploader
   */
  id: string;

  /**
   * Callback when file is selected
   */
  onChange: (file: File) => void;

  /**
   * Current upload progress (0-100)
   */
  progress?: number;

  /**
   * Whether upload is in progress
   */
  isUploading?: boolean;

  /**
   * Accepted file types
   */
  accept?: FileType;

  /**
   * Button variant style
   */
  variant?: 'default' | 'outline' | 'dropzone';

  /**
   * Custom button text
   */
  buttonText?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Current file URL (for preview)
   */
  value?: string;

  /**
   * Callback when file is removed
   */
  onRemove?: () => void;

  /**
   * Show preview of uploaded file
   */
  showPreview?: boolean;
}

export const FileUploader = forwardRef<HTMLInputElement, FileUploaderProps>(
  (
    {
      id,
      onChange,
      progress = 0,
      isUploading = false,
      accept = 'image',
      variant = 'dropzone',
      buttonText,
      disabled = false,
      className,
      value,
      onRemove,
      showPreview = true,
    },
    _ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleClick = () => {
      if (!isUploading && !disabled) {
        inputRef.current?.click();
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onChange(file);
      }
      // Reset input value so same file can be selected again
      e.target.value = '';
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (!isUploading && !disabled && e.dataTransfer.files?.[0]) {
        onChange(e.dataTransfer.files[0]);
      }
    };

    const acceptType = getAcceptType(accept);
    const fileTypeDesc = getFileTypeDescription(accept);
    const displayText = buttonText || `Upload ${accept === 'image' ? 'Image' : 'File'}`;

    // Show preview if value exists
    if (showPreview && value && !isUploading) {
      const isImage = accept === 'image' && value.match(/\.(jpg|jpeg|png|gif|webp)$/i);

      return (
        <div className={cn('relative', className)}>
          {isImage ? (
            <div className="relative rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
              <img
                src={value}
                alt="Uploaded preview"
                className="w-full h-48 object-contain"
              />
              {onRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={onRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <FileIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    File uploaded
                  </p>
                  <p className="text-xs text-gray-500">{value}</p>
                </div>
              </div>
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      );
    }

    // Button variant
    if (variant === 'default' || variant === 'outline') {
      return (
        <div className={cn('space-y-2', className)}>
          <input
            ref={inputRef}
            type="file"
            id={id}
            accept={acceptType}
            onChange={handleFileChange}
            className="sr-only"
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant={variant}
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {displayText}
              </>
            )}
          </Button>

          {isUploading && progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-900 font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      );
    }

    // Dropzone variant (default)
    return (
      <div className={cn('space-y-2', className)}>
        <input
          ref={inputRef}
          type="file"
          id={id}
          accept={acceptType}
          onChange={handleFileChange}
          className="sr-only"
          disabled={disabled || isUploading}
        />

        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors cursor-pointer',
            'px-6 py-10 text-center',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400',
            (disabled || isUploading) && 'opacity-50 cursor-not-allowed pointer-events-none',
            className
          )}
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
          ) : (
            <>
              {accept === 'image' ? (
                <ImageIcon className="h-10 w-10 text-gray-400 mb-3" />
              ) : (
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
              )}
            </>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {isUploading ? 'Uploading...' : displayText}
            </p>
            <p className="text-xs text-gray-500">
              {dragActive ? 'Drop file here' : `or drag and drop`}
            </p>
            <p className="text-xs text-gray-400">{fileTypeDesc}</p>
          </div>
        </div>

        {isUploading && progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="text-gray-900 font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    );
  }
);

FileUploader.displayName = 'FileUploader';
