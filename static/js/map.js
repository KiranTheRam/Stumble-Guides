// static/js/map.js
let map;
let markers = [];
let polyline = null;
let geocoder;
let currentLocation = { lat: 39.9566, lng: -75.1899 }; // Default to Drexel
let locationMarker = null;
let locationSource = 'default'; // 'default', 'gps', or 'custom'

function initMap(center = { lat: 39.9566, lng: -75.1899 }) {
    // Initialize geocoder
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById("map"), {
        center: center,
        zoom: 14,
        styles: [
            {
                "featureType": "all",
                "elementType": "geometry",
                "stylers": [{ "color": "#f5f5f5" }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#c9c9c9" }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#9e9e9e" }]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{ "color": "#ffffff" }]
            }
        ]
    });
    
    // Try to get user's current location if allowed
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                currentLocation = userLocation;
                locationSource = 'gps';
                map.setCenter(userLocation);
                
                // Add marker for user's location
                setLocationMarker(userLocation, "Your Location", "#4285F4");
                updateLocationInfo("Using: Your GPS Location");
            },
            () => {
                // Default to Drexel University if geolocation is denied
                console.log("Geolocation permission denied. Using default location.");
                const defaultLocation = { lat: 39.9566, lng: -75.1899 }; // Drexel University
                currentLocation = defaultLocation;
                locationSource = 'default';
                
                // Add marker for default location
                setLocationMarker(defaultLocation, "Default Location (Drexel University)", "#FF9800");
                updateLocationInfo("Using: Default Location (Drexel University)");
            }
        );
    } else {
        // If geolocation is not supported, use default location
        console.log("Geolocation not supported. Using default location.");
        const defaultLocation = { lat: 39.9566, lng: -75.1899 }; // Drexel University
        currentLocation = defaultLocation;
        locationSource = 'default';
        map.setCenter(defaultLocation);
        
        // Add marker for default location
        setLocationMarker(defaultLocation, "Default Location (Drexel University)", "#FF9800");
        updateLocationInfo("Using: Default Location (Drexel University)");
    }
    
    // Set up the custom location button event listener
    document.getElementById('use-custom-location-btn').addEventListener('click', useCustomLocation);
}


function addMarkers(bars) {
    // Clear existing markers
    clearMarkers();
    
    // Add new markers
    bars.forEach((bar, index) => {
        const marker = new google.maps.Marker({
            position: { lat: bar.location.lat, lng: bar.location.lng },
            map: map,
            title: bar.name,
            label: {
                text: (index + 1).toString(),
                color: 'white'
            },
            animation: google.maps.Animation.DROP
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="info-window">
                    <h3>${bar.name}</h3>
                    <p>${bar.address}</p>
                    <p>Rating: ${bar.rating} ★</p>
                    <p>Price: ${getPrice(bar.price_level)}</p>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        markers.push(marker);
    });
    
    // Fit map to markers
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);
        
        // Don't zoom in too far
        const listener = google.maps.event.addListener(map, "idle", () => {
            if (map.getZoom() > 16) map.setZoom(16);
            google.maps.event.removeListener(listener);
        });
    }
}

function drawRoute(route) {
    // Clear existing route
    if (polyline) {
        polyline.setMap(null);
    }
    
    // Create path from route points
    const path = route.map(bar => ({
        lat: bar.location.lat,
        lng: bar.location.lng
    }));
    
    // Create polyline
    polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: "#2196F3",
        strokeOpacity: 1.0,
        strokeWeight: 3
    });
    
    polyline.setMap(map);
    
    // Re-label markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    route.forEach((bar, index) => {
        const marker = new google.maps.Marker({
            position: { lat: bar.location.lat, lng: bar.location.lng },
            map: map,
            title: bar.name,
            label: {
                text: (index + 1).toString(),
                color: 'white'
            }
        });
        markers.push(marker);
    });
}

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

function getPrice(level) {
    const prices = ['Free', '$', '$$', '$$$', '$$$$'];
    return prices[level] || '$';
}

// Set location marker and remove previous one if exists
function setLocationMarker(position, title, color) {
    // Remove existing location marker if present
    if (locationMarker) {
        locationMarker.setMap(null);
    }
    
    // Create new marker
    locationMarker = new google.maps.Marker({
        position: position,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
        },
        title: title
    });
}

// Update the location info text
function updateLocationInfo(text) {
    document.getElementById('current-location-type').textContent = text;
}

// Process custom location entered by user
function useCustomLocation() {
    const locationInput = document.getElementById('custom-location').value.trim();
    
    if (!locationInput) {
        alert('Please enter a location.');
        return;
    }
    
    geocoder.geocode({ 'address': locationInput }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            const customLocation = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
            };
            
            // Update global location
            currentLocation = customLocation;
            locationSource = 'custom';
            
            // Update map and marker
            map.setCenter(customLocation);
            setLocationMarker(customLocation, "Custom Location: " + locationInput, "#4CAF50");
            updateLocationInfo("Using: Custom Location (" + results[0].formatted_address + ")");
            
            // Clear any existing search results
            clearMarkers();
        } else {
            alert('Location not found. Please try a different address or place name.');
        }
    });
}

// Get current location for API calls
function getCurrentLocationForApi() {
    return currentLocation;
}

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', initMap);
