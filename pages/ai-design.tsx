import { useState, useRef } from 'react';
import Head from 'next/head';
import UploadBox from '../components/UploadBox';
import RenderGrid from '../components/RenderGrid';

interface GeneratedImage {
  id: string;
  url: string;
  roomType: string;
  style: string;
  timestamp: Date;
}

export default function AIDesign() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [roomType, setRoomType] = useState('living');
  const [style, setStyle] = useState('minimalist');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          roomType,
          style,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate design');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        roomType,
        style,
        timestamp: new Date(),
      };

      setGeneratedImages(prev => [newImage, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI Interior Design Studio</title>
        <meta name="description" content="Transform your space with AI-powered interior design" />
      </Head>

      <div className="flex h-screen bg-gray-900">
        {/* Sidebar */}
        <aside className="w-64 bg-black border-r border-gray-800 flex flex-col">
          {/* Back Button */}
          <div className="p-6 border-b border-gray-800">
            <a 
              href="/" 
              className="flex items-center space-x-3 text-gray-400 hover:text-white transition group"
            >
              <svg 
                className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="font-medium">Back to 3D Designer</span>
            </a>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {[
              { name: 'Interior', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
              { name: 'Inspiration', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              { name: 'Exterior', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' },
              { name: 'Virtual Staging', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
              { name: 'My Designs', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            ].map((item) => (
              <a
                key={item.name}
                href="#"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition group ${
                  item.active
                    ? 'text-white bg-gray-900'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 flex">
          {/* Left Panel - Upload & Controls */}
          <div className="w-1/3 bg-gray-950 border-r border-gray-800 p-6 overflow-y-auto">
            {/* Upload Section */}
            <div className="mb-6">
              <h2 className="text-white text-lg font-semibold mb-2">
                Upload a picture of your interior
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                For best results, make sure to upload a clear photo in a 90° straight angle.
              </p>
              
              <UploadBox onImageUpload={handleImageUpload} />
            </div>
            
            {/* Room Type */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3 block">
                Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition"
              >
                <option value="living">Living Room</option>
                <option value="bedroom">Bedroom</option>
                <option value="kitchen">Kitchen</option>
                <option value="bathroom">Bathroom</option>
                <option value="office">Office</option>
                <option value="dining">Dining Room</option>
              </select>
            </div>
            
            {/* Style */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3 block">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none transition"
              >
                <option value="minimalist">Minimalist</option>
                <option value="modern">Modern</option>
                <option value="scandinavian">Scandinavian</option>
                <option value="industrial">Industrial</option>
                <option value="bohemian">Bohemian</option>
                <option value="traditional">Traditional</option>
                <option value="luxury">Luxury</option>
                <option value="japanese">Japanese</option>
              </select>
            </div>
            
            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                'Generate Design'
              )}
            </button>
          </div>
          
          {/* Right Panel - Results */}
          <div className="flex-1 bg-gray-950 p-6 overflow-y-auto">
            <h2 className="text-white text-xl font-semibold mb-6">Last generated renders</h2>
            
            <RenderGrid 
              images={generatedImages}
              isLoading={isGenerating}
              error={error}
              onRetry={() => handleGenerate()}
            />
          </div>
        </main>
      </div>
    </>
  );
}
