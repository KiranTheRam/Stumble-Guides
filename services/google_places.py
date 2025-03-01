# services/google_places.py
import requests
import os

GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')

def get_nearby_bars(latitude, longitude, radius, price_range, limit):
    """
    Get nearby bars using Google Places API
    
    Args:
        latitude: User's latitude
        longitude: User's longitude
        radius: Search radius in meters
        price_range: List containing min and max price level [min, max]
        limit: Maximum number of results to return
        
    Returns:
        List of bar objects with details
    """
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    params = {
        'location': f"{latitude},{longitude}",
        'radius': radius,
        'type': 'bar',
        'key': GOOGLE_MAPS_API_KEY,
        'minprice': price_range[0],
        'maxprice': price_range[1]
    }
    
    response = requests.get(url, params=params)
    print("Response Text\n")

    print(response.text)
    data = response.json()
    
    bars = []
    for place in data.get('results', [])[:limit]:
        # Get additional details including photos
        details = get_place_details(place['place_id'])
        
        bar = {
            'id': place['place_id'],
            'name': place['name'],
            'address': place.get('vicinity', ''),
            'location': {
                'lat': place['geometry']['location']['lat'],
                'lng': place['geometry']['location']['lng']
            },
            'rating': place.get('rating', 0),
            'price_level': place.get('price_level', 1),
            'photo': get_photo_url(details.get('photos', [{}])[0].get('photo_reference', '')) if details.get('photos') else None
        }
        bars.append(bar)
    
    # Sort by rating (highest first)
    bars.sort(key=lambda x: x['rating'], reverse=True)
    
    return bars

def get_place_details(place_id):
    """Get additional details for a place"""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    
    params = {
        'place_id': place_id,
        'fields': 'name,photos',
        'key': GOOGLE_MAPS_API_KEY
    }
    
    response = requests.get(url, params=params)
    return response.json().get('result', {})

def get_photo_url(photo_reference, max_width=400):
    """Generate photo URL from photo reference"""
    if not photo_reference:
        return None
        
    return f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={max_width}&photoreference={photo_reference}&key={GOOGLE_MAPS_API_KEY}"
