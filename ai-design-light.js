// AI Design Generator Frontend Logic
(function() {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImage');
    const styleSelect = document.getElementById('styleSelect');
    const generateBtn = document.getElementById('generateBtn');
    const loadingState = document.getElementById('loadingState');
    const resultSection = document.getElementById('resultSection');
    const resultImage = document.getElementById('resultImage');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const downloadBtn = document.getElementById('downloadBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const strengthSlider = document.getElementById('strengthSlider');
    const strengthValue = document.getElementById('strengthValue');
    const customPrompt = document.getElementById('customPrompt');
    const initialState = document.getElementById('initialState');
    const actionButtons = document.getElementById('actionButtons');
    const resultStatus = document.getElementById('resultStatus');
    const fallbackImage = document.getElementById('fallbackImage');

    // State
    let selectedFile = null;
    let currentImageBase64 = null;
    let generatedImageUrl = null;

    // Initialize
    function init() {
        setupEventListeners();
        checkButtonState();
    }

    // Event Listeners
    function setupEventListeners() {
        // Drag and drop
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
        
        // File input
        fileInput.addEventListener('change', handleFileSelect);
        
        // Remove image
        removeImageBtn.addEventListener('click', removeImage);
        
        // Style selection
        styleSelect.addEventListener('change', checkButtonState);
        
        // Generate button
        generateBtn.addEventListener('click', generateDesign);
        
        // Download button
        downloadBtn.addEventListener('click', downloadImage);
        
        // Regenerate button
        regenerateBtn.addEventListener('click', resetForNewGeneration);
        
        // Strength slider
        strengthSlider.addEventListener('input', (e) => {
            strengthValue.textContent = e.target.value;
        });
    }

    // Drag and drop handlers
    function handleDragOver(e) {
        e.preventDefault();
        dropZone.classList.add('drag-active');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
    }

    function handleDrop(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }

    // File handling
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showError('Please upload an image file.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showError('Image size should be less than 10MB.');
            return;
        }

        selectedFile = file;
        displayImagePreview(file);
        convertToBase64(file);
    }

    function displayImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            dropZone.classList.add('hidden');
            imagePreview.classList.remove('hidden');
            checkButtonState();
        };
        reader.readAsDataURL(file);
    }

    function convertToBase64(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImageBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function removeImage() {
        selectedFile = null;
        currentImageBase64 = null;
        fileInput.value = '';
        previewImg.src = '';
        imagePreview.classList.add('hidden');
        dropZone.classList.remove('hidden');
        checkButtonState();
    }

    // Button state management
    function checkButtonState() {
        if (selectedFile && styleSelect.value) {
            generateBtn.disabled = false;
        } else {
            generateBtn.disabled = true;
        }
    }

    // API call to generate design
    async function generateDesign() {
        if (!currentImageBase64 || !styleSelect.value) {
            showError('Please upload an image and select a style.');
            return;
        }

        // Update UI for loading state
        initialState.classList.add('hidden');
        resultSection.classList.add('hidden');
        errorState.classList.add('hidden');
        actionButtons.classList.add('hidden');
        loadingState.classList.remove('hidden');
        generateBtn.disabled = true;
        
        // Update status
        updateStatus('generating', 'Generating design...');

        try {
            // Get selected style details
            const style = styleSelect.value;
            const strength = parseFloat(strengthSlider.value);
            const additionalPrompt = customPrompt.value.trim();
            
            // Build the prompt
            let prompt = `Redesign this room in a ${style} interior design style with matching furniture, appropriate lighting, and cohesive color palette. `;
            
            // Add style-specific details
            const stylePrompts = {
                minimalist: "Focus on clean lines, neutral colors, minimal furniture, and plenty of open space.",
                modern: "Include contemporary furniture, bold geometric patterns, and a sophisticated color scheme.",
                scandinavian: "Add light wood furniture, cozy textiles, neutral colors with pops of pastels, and natural light.",
                luxury: "Include high-end furniture, rich textures, metallic accents, and opulent decorative elements.",
                industrial: "Feature exposed brick, metal fixtures, raw wood, and urban loft aesthetics.",
                bohemian: "Add colorful textiles, plants, eclectic furniture, and artistic decorative elements.",
                traditional: "Include classic furniture pieces, warm colors, ornate details, and timeless elegance.",
                japanese: "Focus on minimalism, natural materials, low furniture, and zen-inspired simplicity."
            };
            
            if (stylePrompts[style]) {
                prompt += stylePrompts[style] + " ";
            }
            
            if (additionalPrompt) {
                prompt += additionalPrompt;
            }

            // Call the backend API
            const response = await fetch('http://localhost:3001/api/ai-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: currentImageBase64,
                    prompt: prompt,
                    strength: strength
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Display the result
            displayResult(data.result);
            
        } catch (error) {
            console.error('Generation error:', error);
            showError(error.message || 'Failed to generate design. Please try again.');
            
            // Show fallback demo image for testing
            showFallbackImage();
        } finally {
            loadingState.classList.add('hidden');
            generateBtn.disabled = false;
            checkButtonState();
        }
    }

    // Display the generated result
    function displayResult(imageUrl) {
        generatedImageUrl = imageUrl;
        resultImage.src = imageUrl;
        
        // Update UI
        initialState.classList.add('hidden');
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        resultSection.classList.remove('hidden');
        actionButtons.classList.remove('hidden');
        
        // Update status
        updateStatus('success', 'Design generated successfully!');
    }
    
    // Show fallback image for testing
    function showFallbackImage() {
        // Array of beautiful interior design images for demo
        const fallbackImages = [
            'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
            'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&q=80',
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
            'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=800&q=80'
        ];
        
        // Select a random fallback image
        const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
        
        if (fallbackImage) {
            fallbackImage.src = randomImage;
        }
        
        // Also set it as the generated image for download functionality
        generatedImageUrl = randomImage;
        
        // Update status
        updateStatus('demo', 'Demo mode - showing sample result');
    }

    // Download the generated image
    async function downloadImage() {
        if (!generatedImageUrl) return;

        try {
            const response = await fetch(generatedImageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-design-${styleSelect.value}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            showError('Failed to download image. Please try right-clicking and saving instead.');
        }
    }

    // Reset for new generation
    function resetForNewGeneration() {
        initialState.classList.remove('hidden');
        resultSection.classList.add('hidden');
        errorState.classList.add('hidden');
        actionButtons.classList.add('hidden');
        updateStatus('ready', 'Ready for generation');
    }

    // Error handling
    function showError(message) {
        errorMessage.textContent = message;
        
        // Update UI
        initialState.classList.add('hidden');
        loadingState.classList.add('hidden');
        resultSection.classList.add('hidden');
        errorState.classList.remove('hidden');
        actionButtons.classList.add('hidden');
        
        // Update status
        updateStatus('error', 'Generation failed');
    }
    
    // Update status indicator
    function updateStatus(type, message) {
        if (!resultStatus) return;
        
        const statusHTML = {
            ready: `<span class="inline-flex items-center text-gray-500">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        ${message}
                    </span>`,
            generating: `<span class="inline-flex items-center text-blue-500">
                            <svg class="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            ${message}
                        </span>`,
            success: `<span class="inline-flex items-center text-green-500">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        ${message}
                    </span>`,
            error: `<span class="inline-flex items-center text-red-500">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                        ${message}
                    </span>`,
            demo: `<span class="inline-flex items-center text-purple-500">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                        </svg>
                        ${message}
                    </span>`
        };
        
        resultStatus.innerHTML = statusHTML[type] || statusHTML.ready;
    }

    // Initialize the app
    init();
})();
