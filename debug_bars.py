#!/usr/bin/env python3
"""
Debug script to retrieve and display all bar results from Google Places API
using the default location (Drexel University, Philadelphia)
"""

import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')
if not GOOGLE_MAPS_API_KEY:
    print("Error: GOOGLE_MAPS_API_KEY not found in environment variables")
    print("Make sure you have a .env file with your API key")
    exit(1)

# Default location (Drexel University)
DEFAULT_LAT = 39.9566
DEFAULT_LNG = -75.1899



def debug_bar_search(radius_miles=1, minprice=1, maxprice=4):
    """
    Search for bars near default location and output all raw results
    
    Args:
        radius_miles: Search radius in miles
        minprice: Minimum price level (1-4)
        maxprice: Maximum price level (1-4)
        
    Returns:
        None (prints results to console)
    """
    # Convert miles to meters
    radius_meters = radius_miles * 1609
    
    # Google Places API endpoint
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    params = {
        'location': f"{DEFAULT_LAT},{DEFAULT_LNG}",
        'radius': radius_meters,
        'type': 'bar',
        # 'keyword': 'bar',
        'key': GOOGLE_MAPS_API_KEY,
        'minprice': minprice,
        'maxprice': maxprice
    }
    
    print(f"Searching for bars near Drexel University (radius: {radius_miles} miles)")
    print(f"Price range: {minprice} to {maxprice}")
    print("-" * 80)
    
    try:
        response = requests.get(url, params=params)

        print(response.text)

        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        data = response.json()
        
        # Print API status
        print(f"API Status: {data.get('status')}")
        
        # Get results
        results = data.get('results', [])
        print(f"Found {len(results)} bars")
        print("-" * 80)
        
        # Print all results with detailed information
        for i, place in enumerate(results, 1):
            print(f"Bar #{i}: {place.get('name')}")
            print(f"  Place ID: {place.get('place_id')}")
            print(f"  Address: {place.get('vicinity', 'N/A')}")
            print(f"  Rating: {place.get('rating', 'N/A')} ({place.get('user_ratings_total', 0)} ratings)")
            print(f"  Price Level: {place.get('price_level', 'N/A')}")
            print(f"  Open Now: {place.get('opening_hours', {}).get('open_now', 'Unknown')}")
            print(f"  Location: {place.get('geometry', {}).get('location', {})}")
            
            # Print types/categories
            print(f"  Types: {', '.join(place.get('types', []))}")
            
            # Check if place has photos
            if place.get('photos'):
                photo_refs = [photo.get('photo_reference', 'N/A')[:20] + '...' for photo in place.get('photos', [])]
                print(f"  Photos: {len(place.get('photos', []))} available {photo_refs}")
            else:
                print("  Photos: None")
                
            # Print raw data in compact JSON format
            print("  Raw Data:")
            print(f"  {json.dumps(place, indent=2)}")
            print("-" * 80)
        
        # Check if there are more pages of results
        if 'next_page_token' in data:
            print("More results available with next_page_token")
        
    except requests.exceptions.RequestException as e:
        print(f"Error making API request: {e}")
    except json.JSONDecodeError:
        print("Error decoding API response")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    # You can modify these parameters as needed
    debug_bar_search(radius_miles=10, minprice=1, maxprice=4)
    
    # Uncomment to test with different parameters
    # debug_bar_search(radius_miles=0.5, minprice=1, maxprice=2)
