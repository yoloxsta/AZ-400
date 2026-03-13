from flask import Flask, jsonify, request
import os
import socket
from datetime import datetime

app = Flask(__name__)

# Get environment variables
APP_VERSION = os.getenv('APP_VERSION', '1.0.0')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'production')

@app.route('/')
def home():
    """Home endpoint - public information"""
    return jsonify({
        'message': 'Welcome to Day 22 Demo API',
        'version': APP_VERSION,
        'environment': ENVIRONMENT,
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': {
            'health': '/health',
            'info': '/api/info',
            'users': '/api/users',
            'products': '/api/products'
        }
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'hostname': socket.gethostname(),
        'version': APP_VERSION
    }), 200

@app.route('/api/info')
def info():
    """API information - requires authentication"""
    return jsonify({
        'api_name': 'Day 22 Demo API',
        'version': APP_VERSION,
        'environment': ENVIRONMENT,
        'hostname': socket.gethostname(),
        'timestamp': datetime.utcnow().isoformat(),
        'description': 'This endpoint is protected by Traefik BasicAuth'
    })

@app.route('/api/users')
def users():
    """Get users list - requires authentication"""
    users_data = [
        {'id': 1, 'name': 'John Doe', 'email': 'john@example.com', 'role': 'admin'},
        {'id': 2, 'name': 'Jane Smith', 'email': 'jane@example.com', 'role': 'user'},
        {'id': 3, 'name': 'Bob Johnson', 'email': 'bob@example.com', 'role': 'user'}
    ]
    return jsonify({
        'total': len(users_data),
        'users': users_data,
        'served_by': socket.gethostname()
    })

@app.route('/api/products')
def products():
    """Get products list - requires authentication"""
    products_data = [
        {'id': 1, 'name': 'Laptop', 'price': 1200, 'stock': 15},
        {'id': 2, 'name': 'Mouse', 'price': 25, 'stock': 100},
        {'id': 3, 'name': 'Keyboard', 'price': 75, 'stock': 50},
        {'id': 4, 'name': 'Monitor', 'price': 300, 'stock': 30}
    ]
    return jsonify({
        'total': len(products_data),
        'products': products_data,
        'served_by': socket.gethostname()
    })

@app.route('/api/stats')
def stats():
    """Get API statistics - requires authentication"""
    return jsonify({
        'total_endpoints': 6,
        'protected_endpoints': 4,
        'public_endpoints': 2,
        'uptime': 'Available',
        'hostname': socket.gethostname(),
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
