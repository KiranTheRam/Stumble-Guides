# app.py
from flask import Flask, render_template, request, jsonify
import os
from services.google_places import get_nearby_bars
from services.google_directions import get_directions
from services.route_optimizer import optimize_route

app = Flask(__name__)

# Get API key from environment variable
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')

@app.route('/')
def index():
    return render_template('index.html', api_key=GOOGLE_MAPS_API_KEY)

@app.route('/api/bars', methods=['POST'])
def find_bars():
    data = request.json
    latitude = data.get('latitude', 39.9566)  # Default to Drexel University
    longitude = data.get('longitude', -75.1899)
    radius = data.get('radius', 1609)  # Default to 1 mile in meters
    price_range = data.get('priceRange', [1, 4])  # Default to all price ranges
    limit = data.get('limit', 5)  # Default to 5 bars
    
    bars = get_nearby_bars(latitude, longitude, radius, price_range, limit)
    return jsonify(bars)

@app.route('/api/route', methods=['POST'])
def generate_route():
    data = request.json
    selected_bars = data.get('selectedBars', [])
    
    # Optimize route based on distance
    optimized_route = optimize_route(selected_bars)
    
    # Get directions between locations
    directions = get_directions(optimized_route)

    return jsonify({
        'route': optimized_route,
        'directions': directions
    })

# API endpoint for BAC calculation (if you need server-side calculation)
@app.route('/api/bac/calculate', methods=['POST'])
def calculate_bac():
    data = request.json
    personal_info = data.get('personalInfo', {})
    drinks = data.get('drinks', [])
    
    # You could implement server-side BAC calculation here if needed
    # For now, we're doing calculations client-side in JavaScript
    
    return jsonify({
        'success': True,
        'message': 'BAC calculation request received'
    })

# API endpoint to save user profile data (optional, for future use)
@app.route('/api/user/profile', methods=['POST'])
def save_user_profile():
    data = request.json
    
    # Here you would typically save this to a database
    # For now, we're storing everything in the browser's localStorage
    
    return jsonify({
        'success': True,
        'message': 'Profile saved successfully'
    })

if __name__ == '__main__':
    app.run(debug=True)
