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
            request.user_role = payload.get('role', 'user')
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
    def get_all_users(self):
        """
        List all users — admin only

        Route: GET /api/users
        """
        if getattr(request, 'user_role', 'user') != 'admin':
            return jsonify({'message': 'Admin access required'}), 403

        skip  = request.args.get('skip',  0,   type=int)
        limit = request.args.get('limit', 100, type=int)
        q     = request.args.get('q',     None)
        success, message, result = self.auth_service.get_all_users(skip=skip, limit=limit, q=q)
        if success:
            return jsonify({'success': True, 'data': result}), 200
        return jsonify({'success': False, 'message': message}), 400

    @token_required
    def create_user_admin(self):
        """
        Admin creates a new user

        Route: POST /api/users
        Body: { username, email, password, role }
        """
        if getattr(request, 'user_role', 'user') != 'admin':
            return jsonify({'message': 'Admin access required'}), 403

        data = request.get_json()
        success, message, result = self.auth_service.create_user_by_admin(
            username=data.get('username') if data else None,
            email=data.get('email')    if data else None,
            password=data.get('password') if data else None,
            role=data.get('role', 'user') if data else 'user',
        )
        if success:
            return jsonify({'success': True, 'message': message, 'data': result}), 201
        return jsonify({'success': False, 'message': message}), 400

    @token_required
    def update_user_admin(self, user_id):
        """
        Admin updates a user

        Route: PUT /api/users/<user_id>
        Body: { username?, email?, password?, role? }
        """
        if getattr(request, 'user_role', 'user') != 'admin':
            return jsonify({'message': 'Admin access required'}), 403

        data = request.get_json() or {}
        success, message, result = self.auth_service.update_user_admin(
            user_id,
            username=data.get('username') or None,
            email=data.get('email')    or None,
            password=data.get('password') or None,
            role=data.get('role')     or None,
        )
        if success:
            return jsonify({'success': True, 'message': message, 'data': result}), 200
        return jsonify({'success': False, 'message': message}), 400

    @token_required
    def delete_user_admin(self, user_id):
        """
        Admin deletes a user

        Route: DELETE /api/users/<user_id>
        """
        if getattr(request, 'user_role', 'user') != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        if user_id == request.user_id:
            return jsonify({'success': False, 'message': 'Cannot delete your own account'}), 400
        # Prevent deletion of the protected root admin account
        target = self.auth_service.user_repository.find_by_id(user_id)
        if target and target.get('email', '').lower() == self.auth_service.PROTECTED_EMAIL:
            return jsonify({'success': False, 'message': 'This account cannot be deleted'}), 403

        success, message, _ = self.auth_service.delete_user_admin(user_id)
        if success:
            return jsonify({'success': True, 'message': message}), 200
        return jsonify({'success': False, 'message': message}), 404

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
