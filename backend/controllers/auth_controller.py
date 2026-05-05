"""
Auth Controller - Handles authentication API endpoints
"""
from flask import request, jsonify
from functools import wraps

def token_required(f):
    """
    Decorator to verify JWT token
    
    Args:
        f: Function to decorate
        
    Returns:
        Decorated function
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            token = token.split(' ')[1]  # Bearer <token>
            auth_service = args[0].auth_service  # Get auth_service from self
            payload = auth_service.verify_token(token)
            request.user_id = payload['user_id']
        except IndexError:
            return jsonify({'message': 'Invalid authorization header'}), 401
        except Exception as e:
            return jsonify({'message': str(e)}), 401
        
        return f(*args, **kwargs)
    return decorated

class AuthController:
    """Controller for authentication endpoints"""
    
    def __init__(self, auth_service):
        """
        Initialize auth controller
        
        Args:
            auth_service: AuthService instance
        """
        self.auth_service = auth_service
    
    def register(self):
        """
        Register a new user
        
        Route: POST /api/auth/register
        Body: {
            "username": "user",
            "email": "user@example.com",
            "password": "password123"
        }
        
        Returns:
            Response with user data and token or error message
        """
        data = request.get_json()
        
        success, message, result = self.auth_service.register_user(
            username=data.get('username') if data else None,
            email=data.get('email') if data else None,
            password=data.get('password') if data else None
        )
        
        if success:
            return jsonify({
                'message': message,
                'token': result['token'],
                'user': result['user']
            }), 201
        else:
            return jsonify({'message': message}), 400 if 'Missing' in message else 409
    
    def login(self):
        """
        Login user
        
        Route: POST /api/auth/login
        Body: {
            "email": "user@example.com",
            "password": "password123"
        }
        
        Returns:
            Response with user data and token or error message
        """
        data = request.get_json()
        
        success, message, result = self.auth_service.login_user(
            email=data.get('email') if data else None,
            password=data.get('password') if data else None
        )
        
        if success:
            return jsonify({
                'message': message,
                'token': result['token'],
                'user': result['user']
            }), 200
        else:
            return jsonify({'message': message}), 401
    
    @token_required
    def get_profile(self):
        """
        Get user profile (protected route)
        
        Route: GET /api/auth/profile
        Headers: Authorization: Bearer <token>
        
        Returns:
            Response with user profile or error message
        """
        success, message, user = self.auth_service.get_user_profile(request.user_id)
        
        if success:
            return jsonify({'user': user}), 200
        else:
            return jsonify({'message': message}), 404
