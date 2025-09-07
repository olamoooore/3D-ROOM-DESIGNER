import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl, roomType, style } = req.body;

  if (!imageUrl || !roomType || !style) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) {
    return res.status(500).json({ error: 'Hugging Face API key not configured' });
  }

  try {
    // Convert image URL to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

    // Prepare the prompt for image-to-image generation
    const prompt = `Redesign this ${roomType} in ${style} style with modern furniture and decor, high quality, professional interior design, realistic lighting, detailed textures`;

    // Call Hugging Face Inference API
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 7.5,
            width: 512,
            height: 512,
          },
        }),
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('Hugging Face API error:', errorText);
      throw new Error(`Hugging Face API error: ${hfResponse.status}`);
    }

    // Get the generated image as blob
    const imageBlob = await hfResponse.blob();
    
    // Set appropriate headers for image response
    res.setHeader('Content-Type', imageBlob.type);
    res.setHeader('Content-Length', imageBlob.size.toString());
    
    // Convert blob to buffer and send
    const buffer = await imageBlob.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate design',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
