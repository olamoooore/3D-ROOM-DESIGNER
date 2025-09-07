import { useState } from 'react';

interface GeneratedImage {
  id: string;
  url: string;
  roomType: string;
  style: string;
  timestamp: Date;
}

interface RenderGridProps {
  images: GeneratedImage[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function RenderGrid({ images, isLoading, error, onRetry }: RenderGridProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-red-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-red-400 font-medium mb-1">Generation Failed</h3>
            <p className="text-gray-400 text-sm mb-3">{error}</p>
            <button
              onClick={onRetry}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition"
            >
              Try again →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-gray-400 mt-4 font-medium">Creating your AI-powered design...</p>
        <p className="text-gray-500 text-sm mt-2">This may take 10-30 seconds</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 font-medium mb-2">No renders yet</p>
        <p className="text-gray-600 text-sm">Upload an image and generate your first design</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group bg-gray-900 rounded-xl overflow-hidden hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10 border border-gray-800 hover:border-purple-500/50"
            style={{
              animationDelay: `${index * 0.1}s`,
              animation: 'fadeInUp 0.6s ease-out forwards',
            }}
          >
            <div className="relative">
              <img
                src={image.url}
                alt={`Generated ${image.roomType} design`}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => setSelectedImage(image)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <button
                  onClick={() => setSelectedImage(image)}
                  className="opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">
                  {capitalizeFirst(image.roomType)} Design
                </h3>
                <span className="text-gray-500 text-xs">
                  {formatDate(image.timestamp)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                  {capitalizeFirst(image.style)}
                </span>
                <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                  AI Generated
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedImage.url}
              alt={`Generated ${selectedImage.roomType} design`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="p-6 bg-gray-900 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-xl font-semibold mb-1">
                    {capitalizeFirst(selectedImage.roomType)} Design
                  </h3>
                  <p className="text-gray-400">
                    {capitalizeFirst(selectedImage.style)} style • {formatDate(selectedImage.timestamp)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedImage.url;
                      link.download = `ai-design-${selectedImage.roomType}-${Date.now()}.jpg`;
                      link.click();
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
