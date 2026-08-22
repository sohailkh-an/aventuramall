'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UploadCloud, X, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (base64: string) => void;
  error?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUpload({ label, value, onChange, error }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(value || '');
  const [uploadError, setUploadError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');

    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG, PNG, or WEBP)');
      return;
    }

    setIsLoading(true);

    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new window.Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(event.target?.result as string);
              return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          };
          img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
      });
    };

    compressImage(file)
      .then((compressedBase64) => {
        setPreview(compressedBase64);
        onChange(compressedBase64);
      })
      .catch(() => {
        setUploadError('Failed to process the image. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleRemove = () => {
    setPreview('');
    setUploadError('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const finalError = uploadError || error;

  return (
    <div className="space-y-2">
      <Label className={finalError ? "text-red-500" : ""}>{label}</Label>

      {preview ? (
        <div className="relative w-full max-w-sm overflow-hidden rounded-lg border-2 border-muted h-48 bg-muted/20 flex items-center justify-center">
          <Image
            src={preview}
            alt="Upload preview"
            fill
            style={{ objectFit: 'cover' }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center w-full max-w-sm h-48 border-2 border-dashed rounded-lg ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-muted/50'} transition-colors ${finalError ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-muted"}`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 text-muted-foreground mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Processing image...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload image</p>
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WEBP</p>
            </>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        disabled={isLoading}
      />
      {finalError && (
        <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{finalError}</p>
        </div>
      )}
    </div>
  );
}
