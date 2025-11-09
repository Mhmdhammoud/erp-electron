import { useState } from 'react';
import axios from 'axios';

interface UploadProgress {
  [key: string]: number;
}

interface UseUploadReturn {
  uploadProgress: UploadProgress;
  isUploading: boolean;
  error: string | null;
  handleUpload: (file: File, uploadId: string) => Promise<string>;
  resetError: () => void;
}

const UPLOAD_ENDPOINT = import.meta.env.VITE_UPLOAD_ENDPOINT || 'http://localhost:3000/upload';
const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'erp-uploads';

export function useUpload(): UseUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File, uploadId: string): Promise<string> => {
    // Validate file size (max 5MB)
    const maxFileSize = 5 * 1024 * 1024; // 5 MB in bytes
    if (file.size > maxFileSize) {
      const errorMsg = 'File size exceeds the maximum limit of 5 MB.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress((prev) => ({ ...prev, [uploadId]: 0 }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${UPLOAD_ENDPOINT}?bucket=${STORAGE_BUCKET}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress((prev) => ({
                ...prev,
                [uploadId]: percentCompleted,
              }));
            }
          },
        }
      );

      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[uploadId];
        return newProgress;
      });
      setIsUploading(false);

      return response.data.file || response.data.url;
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[uploadId];
        return newProgress;
      });

      const errorMessage =
        err?.response?.data?.message || err?.message || 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetError = () => {
    setError(null);
  };

  return {
    uploadProgress,
    isUploading,
    error,
    handleUpload,
    resetError,
  };
}
