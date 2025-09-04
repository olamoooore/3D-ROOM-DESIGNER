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
            
            // Call API (or use fallback for demo)
            const response = await fetch('http://localhost:3001/api/ai-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: currentImageBase64,
                    prompt: prompt,
                    strength: 0.75
                })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            displayResult(data.result);
            
        } catch (error) {
            console.error('Generation error:', error);
            // Use fallback for demo
            useFallbackDemo();
        } finally {
            loadingState.classList.add('hidden');
            generateBtn.disabled = false;
            checkButtonState();
        }
    }
    
    // Display result
    function displayResult(imageUrl) {
        const result = {
            id: Date.now(),
            image: imageUrl,
            room: roomType.value,
            style: styleSelect.value,
            timestamp: new Date().toISOString()
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
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="downloadImage('${result.image}')" class="bg-black/50 backdrop-blur text-white p-2 rounded-lg hover:bg-black/70 transition">
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
    
    // Error handling
    function showError(message) {
        errorMessage.textContent = message;
        errorState.classList.remove('hidden');
        loadingState.classList.add('hidden');
    }
    
    // Initialize
    init();
})();
