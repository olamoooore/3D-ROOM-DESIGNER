# AI Interior Design Studio - Setup Guide

## Overview
This is a modern AI-powered interior design application built with Next.js, React, and Hugging Face's Stable Diffusion API. The app allows users to upload room images and generate AI-powered interior design suggestions.

## Features
- 🎨 Modern dark UI with TailwindCSS
- 📸 Drag-and-drop image upload with preview
- 🤖 AI-powered design generation using Hugging Face
- 🖼️ Grid display of generated results with modal view
- 📱 Responsive design
- ⚡ Real-time loading states and error handling

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Hugging Face account and API key

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
HF_API_KEY=your_hugging_face_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Get Hugging Face API Key
1. Go to [Hugging Face](https://huggingface.co/)
2. Create an account or sign in
3. Go to Settings > Access Tokens
4. Create a new token with "Read" permissions
5. Copy the token and add it to your `.env.local` file

### 4. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## File Structure
```
├── pages/
│   ├── ai-design.tsx          # Main AI design page
│   └── api/
│       └── ai-generate.ts     # Hugging Face API integration
├── components/
│   ├── UploadBox.tsx          # Drag-and-drop upload component
│   └── RenderGrid.tsx         # Results display with modal
├── config.env                 # Environment variables template
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Usage
1. **Upload Image**: Drag and drop or click to upload a room image
2. **Select Room Type**: Choose from Living Room, Bedroom, Kitchen, etc.
3. **Choose Style**: Select from Minimalist, Modern, Scandinavian, etc.
4. **Generate**: Click "Generate Design" to create AI-powered suggestions
5. **View Results**: Browse generated images in the grid and click to enlarge

## API Integration
The app uses Hugging Face's Inference API with the `stabilityai/stable-diffusion-2` model for image-to-image generation. The API endpoint `/api/ai-generate` handles:
- Image preprocessing and base64 encoding
- Prompt generation based on room type and style
- Hugging Face API calls
- Image response handling

## Customization
- **Styles**: Add new design styles in the dropdown options
- **Room Types**: Extend room type options as needed
- **UI Theme**: Modify TailwindCSS classes for different color schemes
- **API Model**: Change the Hugging Face model in `pages/api/ai-generate.ts`

## Troubleshooting
- **API Key Issues**: Ensure your Hugging Face API key is valid and has proper permissions
- **Image Upload**: Check that uploaded images are in supported formats (PNG, JPG, GIF)
- **Generation Failures**: Verify your internet connection and API key validity
- **Build Issues**: Make sure all dependencies are installed with `npm install`

## Production Deployment
For production deployment:
1. Set up environment variables in your hosting platform
2. Run `npm run build` to create production build
3. Deploy the `.next` folder and other necessary files
4. Ensure your hosting platform supports Node.js 18+

## Support
For issues or questions, please check the console logs and ensure all environment variables are properly configured.
