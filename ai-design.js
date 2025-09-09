// AI Design Generator - Dark Theme Version
(function() {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImage');
    const roomType = document.getElementById('roomType');
    const styleSelect = document.getElementById('styleSelect');
    const generateBtn = document.getElementById('generateBtn');
    const loadingState = document.getElementById('loadingState');
    const initialState = document.getElementById('initialState');
    const resultsContainer = document.getElementById('resultsContainer');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const retryBtn = document.getElementById('retryBtn');
    
    // State
    let selectedFile = null;
    let currentImageBase64 = null;
    let generatedResults = [];
    
    // Initialize
    function init() {
        setupEventListeners();
        checkButtonState();
        loadPreviousResults();
        checkAPIHealth();
    }
    
    // Check API health status
    async function checkAPIHealth() {
        try {
            const response = await fetch('http://127.0.0.1:3001/health');
            const data = await response.json();
            
            if (data.status === 'ready') {
                console.log('✅ Production Local AI is ready');
                showAPIStatus('ready', `Production AI ready on ${data.device?.toUpperCase() || 'LOCAL'}`);
            } else if (data.status === 'loading') {
                console.warn('⚠️ AI models are loading');
                showAPIStatus('loading', 'Production AI models loading...');
            } else {
                console.warn('⚠️ AI is initializing');
                showAPIStatus('loading', 'Production AI initializing...');
            }
        } catch (error) {
            console.warn('⚠️ Local Stable Diffusion API is not running');
            showAPIStatus('offline', 'Local AI is offline - start server to use');
        }
    }
    
    // Show API status in UI
    function showAPIStatus(status, message) {
        // Remove existing status if any
        const existingStatus = document.getElementById('apiStatus');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Create status indicator
        const statusDiv = document.createElement('div');
        statusDiv.id = 'apiStatus';
        statusDiv.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300`;
        
        if (status === 'ready') {
            statusDiv.className += ' bg-green-900/80 text-green-200 border border-green-700';
            statusDiv.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>${message}</span>
                </div>
            `;
        } else if (status === 'loading') {
            statusDiv.className += ' bg-yellow-900/80 text-yellow-200 border border-yellow-700';
            statusDiv.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>${message}</span>
                </div>
            `;
        } else {
            statusDiv.className += ' bg-red-900/80 text-red-200 border border-red-700';
            statusDiv.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>${message}</span>
                </div>
            `;
        }
        
        document.body.appendChild(statusDiv);
        
        // Auto-hide after 5 seconds if ready
        if (status === 'ready') {
            setTimeout(() => {
                if (statusDiv) {
                    statusDiv.style.opacity = '0';
                    setTimeout(() => statusDiv.remove(), 300);
                }
            }, 5000);
        }
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
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', removeImage);
        }
        
        // Generate button
        generateBtn.addEventListener('click', generateDesign);
        
        // Retry button
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                errorState.classList.add('hidden');
                generateDesign();
            });
        }
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
        
        if (file.size > 10 * 1024 * 1024) {
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
        generateBtn.disabled = !selectedFile;
    }
    
    // Generate design
    async function generateDesign() {
        if (!currentImageBase64) {
            showError('Please upload an image first.');
            return;
        }
        
        // Hide states
        initialState.classList.add('hidden');
        errorState.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        
        // Show loading
        loadingState.classList.remove('hidden');
        generateBtn.disabled = true;
        
        try {
            // Build prompt based on selections
            const room = roomType.value;
            const style = styleSelect.value;
            
            const stylePrompts = {
                minimalist: "minimalist design with clean lines, neutral colors, and uncluttered spaces",
                modern: "modern contemporary design with sleek furniture and sophisticated color palette",
                scandinavian: "Scandinavian design with light wood, cozy textiles, and natural light",
                industrial: "industrial design with exposed materials, metal fixtures, and urban aesthetics",
                bohemian: "bohemian design with colorful textiles, plants, and eclectic decorative elements",
                traditional: "traditional design with classic furniture, warm colors, and timeless elegance",
                luxury: "luxury design with high-end furniture, rich textures, and opulent details",
                japanese: "Japanese minimalist design with natural materials and zen-inspired simplicity"
            };
            
            const prompt = `Transform this ${room} into a beautiful ${stylePrompts[style]}. Professional interior design photography, high quality, 8k resolution.`;
            
            // Call Production Local Stable Diffusion API
            const formData = new FormData();
            
            // Convert base64 back to file for the production server
            const base64Data = currentImageBase64.split(',')[1];
            const imageBlob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], {type: 'image/png'});
            
            formData.append('image', imageBlob, 'room.png');
            formData.append('style', style);
            formData.append('room_type', room);
            formData.append('strength', '0.75');
            formData.append('steps', '20');
            formData.append('guidance_scale', '7.5');
            
            const response = await fetch('http://127.0.0.1:3001/generate', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Local API request failed');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Generation failed');
            }
            
            // Fix: Use data.image instead of data.result
            displayResult({
                image: data.image,
                style: data.style || style,
                room_type: data.room_type || room,
                message: data.message || 'Design generated successfully'
            });
            
        } catch (error) {
            console.error('Generation error:', error);
            
            // Check if it's a connection error to local API
            if (error.message.includes('Failed to fetch') || error.message.includes('Local API')) {
                showError('Local Stable Diffusion API is not running. Please start the server with: python sd_api_server.py');
            } else {
                showError(`Generation failed: ${error.message}`);
            }
        } finally {
            loadingState.classList.add('hidden');
            generateBtn.disabled = false;
            checkButtonState();
        }
    }
    
    // Display result
    function displayResult(data) {
        const result = {
            id: Date.now(),
            image: data.image || data, // Handle both new format and old format
            room: data.room_type || roomType.value,
            style: data.style || styleSelect.value,
            timestamp: new Date().toISOString(),
            message: data.message || 'Design generated'
        };
        
        generatedResults.unshift(result);
        saveResults();
        renderResults();
    }
    
    // Use fallback demo images
    function useFallbackDemo() {
        const demoImages = [
            'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
            'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&q=80',
            'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&q=80',
            'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
            'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80'
        ];
        
        const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
        displayResult(randomImage);
    }
    
    // Render results grid
    function renderResults() {
        if (generatedResults.length === 0) {
            initialState.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            return;
        }
        
        initialState.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        resultsContainer.innerHTML = '';
        
        generatedResults.slice(0, 6).forEach((result, index) => {
            const card = createResultCard(result, index);
            resultsContainer.appendChild(card);
        });
    }
    
    // Create result card
    function createResultCard(result, index) {
        const card = document.createElement('div');
        card.className = 'render-card bg-gray-900 rounded-xl overflow-hidden cursor-pointer fade-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const roomLabels = {
            living: 'Living Room',
            bedroom: 'Bedroom',
            kitchen: 'Kitchen',
            bathroom: 'Bathroom',
            office: 'Office',
            dining: 'Dining Room'
        };
        
        card.innerHTML = `
            <div class="relative group">
                <img src="${result.image}" alt="Generated Design" class="w-full h-48 object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="absolute bottom-0 left-0 right-0 p-4">
                        <p class="text-white text-sm font-medium">${roomLabels[result.room] || 'Room'}</p>
                        <p class="text-gray-300 text-xs">${result.style}</p>
                    </div>
                </div>
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onclick="deleteResult(${result.id})" class="bg-red-500/80 backdrop-blur text-white p-2 rounded-lg hover:bg-red-600/90 transition" title="Delete image">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                    <button onclick="downloadImage('${result.image}')" class="bg-black/50 backdrop-blur text-white p-2 rounded-lg hover:bg-black/70 transition" title="Download image">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            viewFullImage(result.image);
        });
        
        return card;
    }
    
    // View full image
    function viewFullImage(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8 fade-in';
        modal.innerHTML = `
            <div class="relative max-w-5xl max-h-full">
                <img src="${imageUrl}" alt="Full view" class="max-w-full max-h-full rounded-xl">
                <button class="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-lg hover:bg-black/70 transition">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('button')) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }
    
    // Download image
    window.downloadImage = async function(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-design-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };
    
    // Save results to localStorage
    function saveResults() {
        localStorage.setItem('aiDesignResults', JSON.stringify(generatedResults.slice(0, 10)));
    }
    
    // Load previous results
    function loadPreviousResults() {
        const saved = localStorage.getItem('aiDesignResults');
        if (saved) {
            try {
                generatedResults = JSON.parse(saved);
                renderResults();
            } catch (error) {
                console.error('Failed to load saved results:', error);
            }
        }
    }
    
    // Delete result function
    function deleteResult(id) {
        if (confirm('Are you sure you want to delete this generated design?')) {
            generatedResults = generatedResults.filter(result => result.id !== id);
            saveResults();
            renderResults();
        }
    }
    
    // Download image function
    function downloadImage(imageUrl) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `interior-design-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // View full image function
    function viewFullImage(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
        modal.onclick = () => document.body.removeChild(modal);
        
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-full">
                <img src="${imageUrl}" alt="Full Size Design" class="max-w-full max-h-full object-contain rounded-lg">
                <button onclick="document.body.removeChild(this.closest('.fixed'))" class="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Error handling
    function showError(message) {
        errorMessage.textContent = message;
        errorState.classList.remove('hidden');
        loadingState.classList.add('hidden');
    }
    
    // Initialize
    init();
})();
