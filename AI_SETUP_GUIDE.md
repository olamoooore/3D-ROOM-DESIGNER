# AI Interior Design Generator Setup Guide

## Overview
This feature adds AI-powered interior design generation to your Room Designer application using Replicate's Stable Diffusion API.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Replicate API Key
Create a `.env` file in the project root:
```
REPLICATE_API_KEY=your_replicate_api_key_here
PORT=3001
```

Get your API key from: https://replicate.com/account/api-tokens

### 3. Start the Backend Server
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

### 4. Access the Application
- Main 3D Designer: http://localhost:3001/
- AI Design Generator: http://localhost:3001/ai-design

## Features

### AI Design Generator Page
- **Beautiful UI**: Modern, responsive design with Tailwind CSS
- **Drag & Drop**: Easy image upload with drag-and-drop support
- **Style Presets**: 8 different interior design styles to choose from
  - Minimalist
  - Modern
  - Scandinavian
  - Luxury
  - Industrial
  - Bohemian
  - Traditional
  - Japanese
- **Advanced Options**: 
  - Transformation strength control (0.3 - 1.0)
  - Custom prompt additions
- **Real-time Preview**: See your uploaded image before transformation
- **Download Results**: Save generated designs locally

### Backend API Endpoints

#### `POST /api/ai-generate`
Main endpoint for AI design generation.

**Request Body:**
```json
{
  "image": "base64_encoded_image",
  "prompt": "Design style and instructions",
  "strength": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "result": "generated_image_url"
}
```

#### `POST /api/ai-generate-alt`
Alternative endpoint using SDXL model for higher quality.

#### `GET /api/health`
Health check endpoint to verify server status.

## Architecture

### Frontend
- **ai-design.html**: Main UI page with Tailwind CSS styling
- **ai-design.js**: Client-side logic for image handling and API calls
- Features:
  - Image preview and validation
  - Base64 encoding for API submission
  - Loading states and error handling
  - Result display and download

### Backend
- **server.js**: Express server with Replicate integration
- **CORS enabled**: Allows cross-origin requests
- **Static file serving**: Serves both the main app and AI generator
- **Error handling**: Comprehensive error messages for debugging

## Customization

### Adding New Styles
Edit the style options in `ai-design.html`:
```html
<option value="your-style">Your Style - Description</option>
```

Then add the corresponding prompt in `ai-design.js`:
```javascript
const stylePrompts = {
  "your-style": "Your detailed style instructions..."
};
```

### Adjusting Model Parameters
In `server.js`, modify the Replicate API call:
```javascript
{
  prompt_strength: 0.7,        // How much to transform (0-1)
  num_inference_steps: 50,     // Quality vs speed (20-100)
  guidance_scale: 7.5,          // Prompt adherence (1-20)
}
```

### Using Different Models
Replace the model ID in `server.js`:
```javascript
await replicate.run(
  "model-owner/model-name:version",
  { input: {...} }
);
```

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Ensure your `.env` file exists and contains a valid REPLICATE_API_KEY
   - Get a key from: https://replicate.com/account/api-tokens

2. **"Failed to generate design" error**
   - Check your internet connection
   - Verify the image size is under 10MB
   - Ensure the image is in a supported format (JPG, PNG)

3. **Slow generation times**
   - Normal generation takes 10-30 seconds
   - First requests may be slower (cold start)
   - Consider reducing `num_inference_steps` for faster results

4. **CORS errors**
   - Make sure the backend server is running on port 3001
   - Check that CORS is enabled in `server.js`

### Development Tips

1. **Testing without API key**: 
   - You can test the UI without making actual API calls
   - Comment out the Replicate call and return a placeholder image URL

2. **Local image testing**:
   - Use smaller images for faster uploads
   - Test with various room types for best results

3. **Performance optimization**:
   - Consider implementing image compression before upload
   - Cache generated results to avoid duplicate API calls

## API Pricing

Replicate charges per prediction. Current pricing:
- ~$0.0023 per image with img2img
- ~$0.0055 per image with SDXL

Check current pricing at: https://replicate.com/pricing

## Security Considerations

1. **API Key Protection**: Never commit your `.env` file to version control
2. **Rate Limiting**: Consider implementing rate limiting in production
3. **Input Validation**: The backend validates image size and format
4. **CORS Configuration**: Adjust CORS settings for production deployment

## Deployment

For production deployment:

1. Set environment variables on your hosting platform
2. Use HTTPS for secure image transmission
3. Implement user authentication if needed
4. Consider CDN for static assets
5. Add monitoring and logging

## Support

For issues or questions:
- Replicate Documentation: https://replicate.com/docs
- Stable Diffusion Guide: https://replicate.com/stability-ai/stable-diffusion
- Model Playground: https://replicate.com/stability-ai/stable-diffusion-img2img

## License

This feature is part of the Room Designer project and follows the same license terms.
