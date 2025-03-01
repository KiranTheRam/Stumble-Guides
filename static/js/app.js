// static/js/app.js
const API_ENDPOINTS = {
    BARS: '/api/bars',
    ROUTE: '/api/route'
};

// State
let allBars = [];
let selectedBars = [];
let routeInfo = null;

// DOM Elements
const findBarsBtn = document.getElementById('find-bars-btn');
const generateRouteBtn = document.getElementById('generate-route-btn');
const radiusInput = document.getElementById('radius');
const radiusValue = document.getElementById('radius-value');
const barLimitInput = document.getElementById('bar-limit');
const priceBtns = document.querySelectorAll('.price-btn');
const barsContainer = document.getElementById('bars-container');
const selectedBarsContainer = document.getElementById('selected-bars-container');
const totalDistance = document.getElementById('total-distance');
const totalTime = document.getElementById('total-time');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set event listeners
    findBarsBtn.addEventListener('click', findBars);
    generateRouteBtn.addEventListener('click', generateRoute);
    radiusInput.addEventListener('input', updateRadiusDisplay);
    
    // Price range filter
    priceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });
    
    // Initialize map (handled in map.js)
    
    // Enable drag & drop for selected bars
    makeBarsSortable();
    
    // Handle window resize events for layout adjustments
    window.addEventListener('resize', handleWindowResize);
    
    // Initial responsive adjustments
    handleWindowResize();
});

// Handle responsive layout adjustments
function handleWindowResize() {
    const width = window.innerWidth;
    
    // Adjust UI based on screen size
    if (width < 576) {
        // Mobile adjustments
        if (barLimitInput.value > 5) {
            barLimitInput.value = 5; // Reduce max bars on mobile
        }
    }
    
    // Refresh layout for drag and drop if active
    if (selectedBars.length > 0) {
        makeBarsSortable();
    }
    
    // Update bar cards to fit screen
    updateCardDisplay();
}

// Update display of all bar cards for responsive layout
function updateCardDisplay() {
    // Update displayed bars
    const displayedCards = document.querySelectorAll('.bar-card');
    displayedCards.forEach(card => {
        const nameElement = card.querySelector('.bar-name');
        const addressElement = card.querySelector('.bar-address');
        
        // Adjust text display based on screen width
        if (window.innerWidth < 400) {
            if (nameElement && nameElement.textContent.length > 15) {
                const originalName = nameElement.textContent;
                nameElement.setAttribute('title', originalName);
                // Truncate with ellipsis
                if (!nameElement.hasAttribute('data-original')) {
                    nameElement.setAttribute('data-original', originalName);
                }
                nameElement.textContent = originalName.substring(0, 15) + '...';
            }
        } else {
            // Restore original name if available
            if (nameElement && nameElement.hasAttribute('data-original')) {
                nameElement.textContent = nameElement.getAttribute('data-original');
            }
        }
    });
}

// Update radius display
function updateRadiusDisplay() {
    radiusValue.textContent = `${radiusInput.value} mile${radiusInput.value !== '1' ? 's' : ''}`;
}

// Find bars based on filters
async function findBars() {
    const radius = parseFloat(radiusInput.value) * 1609; // Convert miles to meters
    const limit = parseInt(barLimitInput.value);
    
    // Get selected price levels
    const priceRange = [];
    priceBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            priceRange.push(parseInt(btn.dataset.value));
        }
    });
    
    const minPrice = Math.min(...priceRange) || 1;
    const maxPrice = Math.max(...priceRange) || 4;
    
    try {
        const position = await getCurrentPosition();
        
        const response = await fetch(API_ENDPOINTS.BARS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: position.lat,
                longitude: position.lng,
                radius: radius,
                priceRange: [minPrice, maxPrice],
                limit: limit
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch bars');
        }
        
        allBars = await response.json();
        
        // Reset selected bars
        selectedBars = [];
        updateSelectedBarsUI();
        
        // Update UI
        displayBars(allBars);
        addMarkers(allBars);
        
        // Handle responsive adjustments for new bars
        handleWindowResize();
        
    } catch (error) {
        console.error('Error finding bars:', error);
        alert('Error finding bars. Please try again.');
    }
}

// Get current position from map.js which handles all location logic
function getCurrentPosition() {
    return new Promise((resolve) => {
        // Get the current location from map.js
        resolve(getCurrentLocationForApi());
    });
}

// Display bars in the sidebar
function displayBars(bars) {
    barsContainer.innerHTML = '';
    
    if (bars.length === 0) {
        barsContainer.innerHTML = '<p>No bars found in this area with the selected filters.</p>';
        return;
    }
    
    bars.forEach(bar => {
        const barCard = document.createElement('div');
        barCard.className = 'bar-card';
        barCard.innerHTML = `
            <img src="${bar.photo || '/static/images/default-bar.jpg'}" class="bar-image" alt="${bar.name}">
            <div class="bar-details">
                <h3 class="bar-name">${bar.name}</h3>
                <div class="bar-meta">
                    <span class="bar-rating">${bar.rating || 'N/A'}</span>
                    <span class="bar-price">${getPrice(bar.price_level)}</span>
                </div>
                <p class="bar-address">${bar.address}</p>
            </div>
        `;
        
        // Add click handler to select/deselect bar
        barCard.addEventListener('click', () => {
            toggleBarSelection(bar);
        });
        
        barsContainer.appendChild(barCard);
    });
    
    // Apply responsive adjustments to new cards
    updateCardDisplay();
}

// Toggle bar selection
function toggleBarSelection(bar) {
    const index = selectedBars.findIndex(b => b.id === bar.id);
    
    if (index === -1) {
        // Add bar to selection
        selectedBars.push(bar);
    } else {
        // Remove bar from selection
        selectedBars.splice(index, 1);
    }
    
    // Update UI
    updateSelectedBarsUI();
    
    // Enable/disable route button
    generateRouteBtn.disabled = selectedBars.length < 2;
}

// Update selected bars UI
function updateSelectedBarsUI() {
    selectedBarsContainer.innerHTML = '';
    
    if (selectedBars.length === 0) {
        selectedBarsContainer.innerHTML = '<p>Select bars from the list to include in your crawl.</p>';
        return;
    }
    
    selectedBars.forEach((bar, index) => {
        const barCard = document.createElement('div');
        barCard.className = 'bar-card sortable-item';
        barCard.dataset.barId = bar.id;
        barCard.innerHTML = `
            <img src="${bar.photo || '/static/images/default-bar.jpg'}" class="bar-image" alt="${bar.name}">
            <div class="bar-details">
                <h3 class="bar-name">${index + 1}. ${bar.name}</h3>
                <div class="bar-meta">
                    <span class="bar-rating">${bar.rating || 'N/A'}</span>
                    <span class="bar-price">${getPrice(bar.price_level)}</span>
                </div>
                <p class="bar-address">${bar.address}</p>
            </div>
        `;
        
        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBarSelection(bar);
        });
        
        barCard.appendChild(removeBtn);
        selectedBarsContainer.appendChild(barCard);
    });
    
    // Refresh drag and drop
    makeBarsSortable();
    
    // Apply responsive adjustments to selected cards
    updateCardDisplay();
}

// Make selected bars sortable (drag and drop)
function makeBarsSortable() {
    const sortableList = selectedBarsContainer;
    const sortableItems = sortableList.querySelectorAll('.sortable-item');
    
    sortableItems.forEach(item => {
        item.draggable = true;
        
        item.addEventListener('dragstart', () => {
            setTimeout(() => item.classList.add('dragging'), 0);
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            
            // Update order in selectedBars array
            const newOrder = [];
            const items = sortableList.querySelectorAll('.sortable-item');
            
            items.forEach(sortableItem => {
                const barId = sortableItem.dataset.barId;
                const bar = selectedBars.find(b => b.id === barId);
                if (bar) {
                    newOrder.push(bar);
                }
            });
            
            selectedBars = newOrder;
            updateSelectedBarsUI();
            
            // If route is already generated, regenerate it
            if (routeInfo) {
                generateRoute();
            }
        });
    });
    
    sortableList.addEventListener('dragover', e => {
        e.preventDefault();
        const draggingItem = document.querySelector('.dragging');
        if (!draggingItem) return;
        
        const afterElement = getDragAfterElement(sortableList, e.clientY);
        
        if (afterElement) {
            sortableList.insertBefore(draggingItem, afterElement);
        } else {
            sortableList.appendChild(draggingItem);
        }
    });
}

// Helper function for drag and drop
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Generate route between selected bars
async function generateRoute() {
    if (selectedBars.length < 2) {
        alert('Please select at least 2 bars to generate a route.');
        return;
    }
    
    try {
        const response = await fetch(API_ENDPOINTS.ROUTE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                selectedBars: selectedBars
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate route');
        }
        
        routeInfo = await response.json();
        
        // Update UI
        totalDistance.textContent = routeInfo.directions.total_distance_text;
        totalTime.textContent = routeInfo.directions.total_duration_text;
        
        // Draw route on map
        drawRoute(routeInfo.route);
        
    } catch (error) {
        console.error('Error generating route:', error);
        alert('Error generating route. Please try again.');
    }
}

// Helper function to format price level
function getPrice(level) {
    switch(level) {
        case 0:
            return 'Free';
        case 1:
            return '$';
        case 2:
            return '$$';
        case 3:
            return '$$$';
        case 4:
            return '$$$$';
        default:
            return '$';
    }
}