import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, Camera } from 'lucide-react';

interface ImageGalleryUploaderProps {
  value?: string;
  onChange: (base64OrUrl: string) => void;
  label?: string;
  required?: boolean;
  aspectRatioLabel?: string;
  maxDimension?: number;
  quality?: number;
  className?: string;
  idPrefix?: string;
}

/**
 * ImageGalleryUploader:
 * Allows user to pick images directly from their device gallery/file system or drag-and-drop.
 * Automatically resizes & compresses the image into high-performance webp/jpeg base64 data url.
 */
export const ImageGalleryUploader: React.FC<ImageGalleryUploaderProps> = ({
  value,
  onChange,
  label = 'Upload Image from Gallery',
  required = false,
  aspectRatioLabel = 'PNG, JPG, WebP up to 10MB',
  maxDimension = 1200,
  quality = 0.85,
  className = '',
  idPrefix = 'image-upload'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }

    // Limit raw upload to 15MB before resizing
    if (file.size > 15 * 1024 * 1024) {
      setError('Image file is too large (max 15MB).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimension maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Could not process image on device.');
          setIsProcessing(false);
          return;
        }

        // Smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp or jpeg data URL
        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        onChange(dataUrl);
        setIsProcessing(false);
      };

      img.onerror = () => {
        setError('Failed to load image file.');
        setIsProcessing(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setError('Error reading image file from gallery.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Gallery upload</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id={`${idPrefix}-file-input`}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload / Preview Box */}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-sm max-h-56 flex items-center justify-center">
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-44 object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center space-x-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Photo</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all flex flex-col items-center justify-center space-y-2 ${
            isDragging
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 scale-[0.99]'
              : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white/50 dark:bg-slate-900/50'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
            {isProcessing ? (
              <span className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isProcessing ? 'Processing image...' : 'Click to browse gallery or drag & drop'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {aspectRatioLabel}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
