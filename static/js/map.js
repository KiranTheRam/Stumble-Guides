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
    
    // Define map styles for dark mode
    const darkModeStyles = [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
        },
    ];
    
    // Define light mode styles
    const lightModeStyles = [
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
    ];
    
    // Determine which style to use based on document class
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const mapStyles = isDarkMode ? darkModeStyles : lightModeStyles;
    
    map = new google.maps.Map(document.getElementById("map"), {
        center: center,
        zoom: 14,
        styles: mapStyles
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
    
    // Handle window resize for responsive map
    window.addEventListener('resize', function() {
        handleMapResize();
    });
    
    // Initial resize handling
    handleMapResize();
}

// Handle responsive map resizing
function handleMapResize() {
    if (map) {
        // Force the map to recalculate dimensions
        google.maps.event.trigger(map, 'resize');
        
        // Re-center the map
        if (locationMarker) {
            map.setCenter(locationMarker.getPosition());
        }
        
        // Adjust zoom based on screen size
        const width = window.innerWidth;
        if (width < 576) {
            map.setZoom(13); // Smaller zoom for mobile
        } else if (width < 992) {
            map.setZoom(14); // Medium zoom for tablets
        } else {
            map.setZoom(14); // Default zoom for desktops
        }
        
        // Fit bounds if markers exist
        if (markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(marker => bounds.extend(marker.getPosition()));
            map.fitBounds(bounds);
            
            // Don't zoom in too far on mobile
            const listener = google.maps.event.addListener(map, "idle", () => {
                if (width < 576 && map.getZoom() > 15) {
                    map.setZoom(15);
                } else if (map.getZoom() > 16) {
                    map.setZoom(16);
                }
                google.maps.event.removeListener(listener);
            });
        }
    }
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
        
        // Add info window with responsive sizing
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="info-window" style="max-width: ${window.innerWidth < 576 ? '200px' : '300px'}">
                    <h3 style="font-size: ${window.innerWidth < 576 ? '14px' : '16px'}; margin-bottom: 5px;">${bar.name}</h3>
                    <p style="font-size: ${window.innerWidth < 576 ? '12px' : '14px'}; margin-bottom: 3px;">${bar.address}</p>
                    <p style="font-size: ${window.innerWidth < 576 ? '12px' : '14px'}; margin-bottom: 3px;">Rating: ${bar.rating} ★</p>
                    <p style="font-size: ${window.innerWidth < 576 ? '12px' : '14px'};">Price: ${getPrice(bar.price_level)}</p>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        markers.push(marker);
    });
    
    // Fit map to markers with responsiveness in mind
    handleMapResize();
}

function drawRoute(route, directions) {
    // Clear existing polylines
    if (polyline) {
        if (Array.isArray(polyline)) {
            polyline.forEach(line => line.setMap(null));
        } else {
            polyline.setMap(null);
        }
    }
    
    // Initialize polyline array
    polyline = [];
    
    // Re-label markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    // Add markers for each bar in the route
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
    
    // If we have directions with encoded paths
    if (directions && directions.routes && directions.routes.length > 0) {
        // For each leg of the journey
        directions.routes.forEach(route => {
            // Get encoded polyline path
            const encodedPath = route.path;
            if (encodedPath) {
                // Decode the polyline
                const decodedPath = google.maps.geometry.encoding.decodePath(encodedPath);
                
                // Create a new polyline for this leg
                const pathLine = new google.maps.Polyline({
                    path: decodedPath,
                    geodesic: true,
                    strokeColor: "#2196F3",
                    strokeOpacity: 1.0,
                    strokeWeight: 3
                });
                
                // Add the polyline to the map
                pathLine.setMap(map);
                polyline.push(pathLine);
            }
        });
    } else {
        // Fallback to direct lines if no path data
        const simplePath = route.map(bar => ({
            lat: bar.location.lat,
            lng: bar.location.lng
        }));
        
        const simpleLine = new google.maps.Polyline({
            path: simplePath,
            geodesic: true,
            strokeColor: "#2196F3",
            strokeOpacity: 1.0,
            strokeWeight: 3
        });
        
        simpleLine.setMap(map);
        polyline.push(simpleLine);
    }
    
    // Adjust map view after route is drawn
    handleMapResize();
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