const express = require('express');
const cors = require('cors');
const Replicate = require('replicate');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the main directory
app.use(express.static(path.join(__dirname)));

// Initialize Replicate
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY || '',
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI Design Generator API is running' });
});

// AI Generation endpoint
app.post('/api/ai-generate', async (req, res) => {
    try {
        const { image, prompt, strength = 0.7 } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image is required' });
        }

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('Generating design with prompt:', prompt);
        console.log('Transformation strength:', strength);

        // Call Replicate API
        const output = await replicate.run(
            "stability-ai/stable-diffusion-img2img:15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d",
            {
                input: {
                    image: image,
                    prompt: prompt,
                    negative_prompt: "ugly, distorted, blurry, low quality, pixelated, oversaturated",
                    prompt_strength: strength,
                    num_outputs: 1,
                    num_inference_steps: 50,
                    guidance_scale: 7.5,
                    scheduler: "DPMSolverMultistep",
                }
            }
        );

        console.log('Generation successful');

        // Return the generated image URL
        res.json({ 
            success: true,
            result: Array.isArray(output) ? output[0] : output 
        });

    } catch (error) {
        console.error('Generation error:', error);
        
        // Handle specific Replicate errors
        if (error.response?.status === 401) {
            return res.status(401).json({ 
                error: 'Invalid API key. Please check your REPLICATE_API_KEY in .env file' 
            });
        }
        
        if (error.response?.status === 422) {
            return res.status(422).json({ 
                error: 'Invalid input parameters. Please check your image and prompt.' 
            });
        }

        res.status(500).json({ 
            error: 'Failed to generate design. Please try again.',
            details: error.message 
        });
    }
});

// Alternative endpoint using different model
app.post('/api/ai-generate-alt', async (req, res) => {
    try {
        const { image, prompt, strength = 0.7 } = req.body;

        if (!image || !prompt) {
            return res.status(400).json({ error: 'Image and prompt are required' });
        }

        console.log('Using alternative model for generation');

        // Alternative: Using SDXL for better quality
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    image: image,
                    prompt: `Interior design photo, professional photography, ${prompt}, high quality, 8k, photorealistic`,
                    negative_prompt: "cartoon, anime, sketch, drawing, ugly, distorted, blurry, low quality",
                    refine: "expert_ensemble_refiner",
                    num_inference_steps: 30,
                    strength: strength,
                    guidance_scale: 7.5,
                }
            }
        );

        console.log('Alternative generation successful');

        res.json({ 
            success: true,
            result: Array.isArray(output) ? output[0] : output 
        });

    } catch (error) {
        console.error('Alternative generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate design with alternative model',
            details: error.message 
        });
    }
});

// Serve the AI design page
app.get('/ai-design', (req, res) => {
    res.sendFile(path.join(__dirname, 'ai-design.html'));
});

// Fallback to serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║     AI Interior Design Generator Server           ║
║                                                    ║
║     Server running on: http://localhost:${PORT}      ║
║     AI Design page: http://localhost:${PORT}/ai-design ║
║                                                    ║
║     API Endpoints:                                 ║
║     POST /api/ai-generate                         ║
║     POST /api/ai-generate-alt                     ║
║     GET  /api/health                               ║
║                                                    ║
╚════════════════════════════════════════════════════╝
    `);
    
    if (!process.env.REPLICATE_API_KEY) {
        console.warn('\n⚠️  Warning: REPLICATE_API_KEY not found in environment variables.');
        console.warn('Please create a .env file with your Replicate API key.\n');
    }
});
