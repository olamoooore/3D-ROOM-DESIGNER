import { useState, useRef, useCallback } from 'react';

interface UploadBoxProps {
  onImageUpload: (imageUrl: string) => void;
}

export default function UploadBox({ onImageUpload }: UploadBoxProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      onImageUpload(result);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      {/* Upload Area */}
      <div
        className={`upload-area rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-purple-500 bg-purple-500/10 scale-105'
            : 'border-gray-600 hover:border-purple-500 hover:bg-purple-500/5'
        } ${
          previewUrl ? 'hidden' : 'block'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          background: 'linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%)',
          border: '2px dashed',
          borderColor: isDragActive ? '#9333ea' : '#4a4a4a',
        }}
      >
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-gray-300 font-medium mb-1">
              {isDragActive ? 'Drop your image here' : 'Drop your image here, or click to browse'}
            </p>
            <p className="text-gray-500 text-sm">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="relative rounded-xl overflow-hidden group">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <button
              onClick={handleRemoveImage}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="absolute top-2 right-2">
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              ✓ Uploaded
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
