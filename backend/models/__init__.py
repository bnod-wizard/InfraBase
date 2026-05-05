"""
Models Module - Database schemas
"""

class User:
    """User model representing the user collection structure"""
    
    # Collection name
    COLLECTION_NAME = 'users'
    
    # Field definitions
    FIELDS = {
        '_id': 'ObjectId',
        'username': 'str (unique)',
        'email': 'str (unique)',
        'password': 'str (hashed)',
        'role': 'str (default: user)',
        'created_at': 'datetime',
        'updated_at': 'datetime'
    }
    
    def __init__(self, username, email, password, role='user', created_at=None, updated_at=None):
        """
        Initialize a User object
        
        Args:
            username (str): Username
            email (str): Email address
            password (str): Hashed password
            role (str): User role (default: 'user')
            created_at (datetime): Creation timestamp
            updated_at (datetime): Last update timestamp
        """
        self.username = username
        self.email = email
        self.password = password
        self.role = role
        self.created_at = created_at
        self.updated_at = updated_at
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            'username': self.username,
            'email': self.email,
            'password': self.password,
            'role': self.role,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create user object from dictionary"""
        return User(
            username=data.get('username'),
            email=data.get('email'),
            password=data.get('password'),
            role=data.get('role', 'user'),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )


# Import Customer model
from .customer_model import Customer

__all__ = ['User', 'Customer']
