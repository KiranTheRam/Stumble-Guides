# services/google_directions.py
import requests
import os

GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')

def get_directions(bars):
    """
    Get walking directions between bars
    
    Args:
        bars: List of bar objects in order of visit
        
    Returns:
        Directions object with routes and estimated walking times, including path data
    """
    if len(bars) < 2:
        return {
            'routes': [],
            'total_distance': 0,
            'total_duration': 0
        }
    
    routes = []
    total_distance = 0
    total_duration = 0
    
    # Get directions between consecutive bars
    for i in range(len(bars) - 1):
        origin = f"{bars[i]['location']['lat']},{bars[i]['location']['lng']}"
        destination = f"{bars[i+1]['location']['lat']},{bars[i+1]['location']['lng']}"
        
        url = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            'origin': origin,
            'destination': destination,
            'mode': 'walking',
            'key': GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data['status'] == 'OK' and data['routes']:
            leg = data['routes'][0]['legs'][0]
            
            # Extract polyline path from the response
            overview_polyline = data['routes'][0].get('overview_polyline', {}).get('points', '')
            
            route = {
                'start_address': leg['start_address'],
                'end_address': leg['end_address'],
                'distance': leg['distance']['text'],
                'distance_value': leg['distance']['value'],  # in meters
                'duration': leg['duration']['text'],
                'duration_value': leg['duration']['value'],  # in seconds
                'steps': leg['steps'],
                'start_location': leg['start_location'],
                'end_location': leg['end_location'],
                'path': overview_polyline  # Add encoded polyline path
            }
            
            routes.append(route)
            total_distance += leg['distance']['value']
            total_duration += leg['duration']['value']

            # convert meters to miles
            total_distance = round(total_distance * 0.000621371, 2)
    
    return {
        'routes': routes,
        'total_distance': total_distance,
        # 'total_distance_text': f"{total_distance / 1000:.1f} km",
        'total_distance_text': f"{total_distance} mi",
        'total_duration': total_duration,
        'total_duration_text': format_duration(total_duration)
    }

def format_duration(seconds):
    """Format duration in seconds to hours and minutes"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    
    if hours > 0:
        return f"{hours} hr {minutes} min"
    else:
        return f"{minutes} min"
