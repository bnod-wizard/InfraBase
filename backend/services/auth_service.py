"""
Auth Service - Contains authentication business logic
"""
import bcrypt
import jwt
from datetime import datetime, timedelta
from pymongo.errors import DuplicateKeyError

class AuthService:
    """Service for authentication operations"""
    
    def __init__(self, user_repository, secret_key):
        """
        Initialize auth service
        
        Args:
            user_repository: UserRepository instance
            secret_key (str): JWT secret key
        """
        self.user_repository = user_repository
        self.secret_key = secret_key
    
    @staticmethod
    def hash_password(password):
        """
        Hash password using bcrypt
        
        Args:
            password (str): Plain text password
            
        Returns:
            str: Hashed password
        """
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password, hashed_password):
        """
        Verify password against hash
        
        Args:
            password (str): Plain text password
            hashed_password (str): Hashed password
            
        Returns:
            bool: True if password matches, False otherwise
        """
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def generate_token(self, user_id, role='user', expires_in_days=7):
        """
        Generate JWT token

        Args:
            user_id (str): User ID
            role (str): User role
            expires_in_days (int): Token expiration in days

        Returns:
            str: JWT token
        """
        payload = {
            'user_id': str(user_id),
            'role': role,
            'exp': datetime.utcnow() + timedelta(days=expires_in_days)
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
    
    def verify_token(self, token):
        """
        Verify JWT token
        
        Args:
            token (str): JWT token
            
        Returns:
            dict: Payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception('Token has expired')
        except jwt.InvalidTokenError:
            raise Exception('Invalid token')
    
    def register_user(self, username, email, password):
        """
        Register a new user
        
        Args:
            username (str): Username
            email (str): Email
            password (str): Password
            
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        # Validation
        if not username or not email or not password:
            return False, 'Missing required fields', None
        
        if len(password) < 6:
            return False, 'Password must be at least 6 characters', None
        
        # Check if user already exists
        if self.user_repository.user_exists(email=email):
            return False, 'Email already registered', None
        
        if self.user_repository.user_exists(username=username):
            return False, 'Username already taken', None
        
        try:
            # Create user
            user_data = {
                'username': username,
                'email': email,
                'password': self.hash_password(password),
                'role': 'user',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            user_id = self.user_repository.create_user(user_data)
            token = self.generate_token(user_id, role='user')

            return True, 'User registered successfully', {
                'token': token,
                'user': {
                    'id': str(user_id),
                    'username': username,
                    'email': email,
                    'role': 'user',
                }
            }
        except DuplicateKeyError:
            return False, 'Email or username already exists', None
        except Exception as e:
            return False, f'Registration error: {str(e)}', None
    
    def login_user(self, email, password):
        """
        Login user
        
        Args:
            email (str): Email
            password (str): Password
            
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        # Validation
        if not email or not password:
            return False, 'Missing email or password', None
        
        # Find user
        user = self.user_repository.find_by_email(email)
        if not user:
            return False, 'Invalid email or password', None
        
        # Verify password
        if not self.verify_password(password, user['password']):
            return False, 'Invalid email or password', None
        
        role = user.get('role', 'user')
        token = self.generate_token(user['_id'], role=role)

        return True, 'Login successful', {
            'token': token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'role': role,
            }
        }
    
    def get_user_profile(self, user_id):
        """
        Get user profile
        
        Args:
            user_id (str): User ID
            
        Returns:
            tuple: (success: bool, message: str, user: dict or None)
        """
        user = self.user_repository.find_by_id(user_id)
        if not user:
            return False, 'User not found', None
        
        return True, 'Success', {
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email'],
            'role': user.get('role', 'user'),
            'created_at': user['created_at'].isoformat()
        }

    def get_all_users(self, skip=0, limit=100):
        """List all users (admin only)"""
        users = self.user_repository.get_all_users(limit=limit, skip=skip)
        result = []
        for u in users:
            result.append({
                'id': str(u['_id']),
                'username': u.get('username', ''),
                'email': u.get('email', ''),
                'role': u.get('role', 'user'),
                'created_at': u['created_at'].isoformat() if u.get('created_at') else None,
            })
        return True, 'Users retrieved', result

    def create_user_by_admin(self, username, email, password, role='user'):
        """Admin creates a user with a specified role"""
        if not username or not email or not password:
            return False, 'Missing required fields', None
        if len(password) < 6:
            return False, 'Password must be at least 6 characters', None
        if role not in ('user', 'admin'):
            return False, 'Role must be user or admin', None
        if self.user_repository.user_exists(email=email):
            return False, 'Email already registered', None
        if self.user_repository.user_exists(username=username):
            return False, 'Username already taken', None
        try:
            user_data = {
                'username': username,
                'email': email,
                'password': self.hash_password(password),
                'role': role,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
            }
            user_id = self.user_repository.create_user(user_data)
            return True, 'User created successfully', {
                'id': str(user_id),
                'username': username,
                'email': email,
                'role': role,
            }
        except DuplicateKeyError:
            return False, 'Email or username already exists', None
        except Exception as e:
            return False, f'Error creating user: {str(e)}', None

    PROTECTED_EMAIL = 'admin@infrabase.com'

    def update_user_admin(self, user_id, username=None, email=None, password=None, role=None):
        """Admin updates a user's details"""
        existing_user = self.user_repository.find_by_id(user_id)
        if not existing_user:
            return False, 'User not found', None
        if role and role not in ('user', 'admin'):
            return False, 'Role must be user or admin', None
        # Protect the root admin account — email, password, and role cannot be changed
        if existing_user.get('email', '').lower() == self.PROTECTED_EMAIL:
            if email or password or role:
                return False, 'Email, password, and role for this account cannot be changed', None
        update = {'updated_at': datetime.utcnow()}
        if username:
            existing = self.user_repository.find_by_username(username)
            if existing and str(existing['_id']) != str(user_id):
                return False, 'Username already taken', None
            update['username'] = username
        if email:
            existing = self.user_repository.find_by_email(email)
            if existing and str(existing['_id']) != str(user_id):
                return False, 'Email already registered', None
            update['email'] = email
        if password:
            if len(password) < 6:
                return False, 'Password must be at least 6 characters', None
            update['password'] = self.hash_password(password)
        if role:
            update['role'] = role
        try:
            self.user_repository.update_user(user_id, update)
            updated = self.user_repository.find_by_id(user_id)
            return True, 'User updated successfully', {
                'id':       str(updated['_id']),
                'username': updated.get('username', ''),
                'email':    updated.get('email', ''),
                'role':     updated.get('role', 'user'),
            }
        except Exception as e:
            return False, str(e), None

    def delete_user_admin(self, user_id):
        """Admin deletes a user by ID"""
        try:
            success = self.user_repository.delete_user(user_id)
            if success:
                return True, 'User deleted successfully', None
            return False, 'User not found', None
        except Exception as e:
            return False, str(e), None
