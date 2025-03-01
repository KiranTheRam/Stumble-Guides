# services/route_optimizer.py
import math

def optimize_route(bars):
    """
    Optimize the route between bars based on shortest distance
    
    Args:
        bars: List of bar objects to include in the route
        
    Returns:
        Optimized list of bars in order of visit
    """
    if len(bars) <= 2:
        return bars
    
    # Simple implementation using nearest neighbor algorithm
    # Start with first bar and always go to the closest next bar
    
    unvisited = bars[1:]  # Skip the first bar as it's our starting point
    route = [bars[0]]  # Start with the first bar
    
    while unvisited:
        current = route[-1]
        
        # Find the nearest unvisited bar
        nearest = min(unvisited, key=lambda bar: calculate_distance(
            current['location']['lat'], 
            current['location']['lng'],
            bar['location']['lat'],
            bar['location']['lng']
        ))
        
        route.append(nearest)
        unvisited.remove(nearest)
    print("Route: ", route)
    return route

def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate the Haversine distance between two points in kilometers"""
    # Radius of the Earth in kilometers
    R = 6371
    
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlng = lng2_rad - lng1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    distance = R * c
    print("Distance is {}", distance)
    return distance
