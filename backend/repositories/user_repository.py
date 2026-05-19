"""
User Repository - Handles all database operations for users
"""
from bson.objectid import ObjectId
from pymongo.errors import DuplicateKeyError

class UserRepository:
    """Repository for user collection operations"""
    
    def __init__(self, db):
        """
        Initialize repository with database connection
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.collection = db['users']
        self._create_indexes()
    
    def _create_indexes(self):
        """Create necessary indexes"""
        self.collection.create_index('email', unique=True)
        self.collection.create_index('username', unique=True)
    
    def create_user(self, user_data):
        """
        Create a new user
        
        Args:
            user_data (dict): User data to insert
            
        Returns:
            str: Inserted user ID
            
        Raises:
            DuplicateKeyError: If email or username already exists
        """
        try:
            result = self.collection.insert_one(user_data)
            return result.inserted_id
        except DuplicateKeyError as e:
            raise DuplicateKeyError(f"User already exists: {str(e)}")
    
    def find_by_email(self, email):
        """
        Find user by email
        
        Args:
            email (str): User email
            
        Returns:
            dict: User document or None
        """
        return self.collection.find_one({'email': email})
    
    def find_by_username(self, username):
        """
        Find user by username
        
        Args:
            username (str): Username
            
        Returns:
            dict: User document or None
        """
        return self.collection.find_one({'username': username})
    
    def find_by_id(self, user_id):
        """
        Find user by ID
        
        Args:
            user_id (str or ObjectId): User ID
            
        Returns:
            dict: User document or None
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            return self.collection.find_one({'_id': user_id})
        except Exception as e:
            return None
    
    def update_user(self, user_id, update_data):
        """
        Update user by ID
        
        Args:
            user_id (str or ObjectId): User ID
            update_data (dict): Data to update
            
        Returns:
            bool: True if updated, False otherwise
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            result = self.collection.update_one(
                {'_id': user_id},
                {'$set': update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            return False
    
    def delete_user(self, user_id):
        """
        Delete user by ID
        
        Args:
            user_id (str or ObjectId): User ID
            
        Returns:
            bool: True if deleted, False otherwise
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            result = self.collection.delete_one({'_id': user_id})
            return result.deleted_count > 0
        except Exception as e:
            return False
    
    def get_all_users(self, limit=100, skip=0, q=None):
        """
        Get all users with optional search filter and pagination.
        """
        query = {}
        if q:
            pattern = {'$regex': q, '$options': 'i'}
            query = {'$or': [{'username': pattern}, {'email': pattern}]}
        return list(self.collection.find(query).skip(skip).limit(limit))
    
    def user_exists(self, email=None, username=None):
        """
        Check if user exists by email or username
        
        Args:
            email (str): User email
            username (str): Username
            
        Returns:
            bool: True if user exists, False otherwise
        """
        if email:
            return self.collection.find_one({'email': email}) is not None
        if username:
            return self.collection.find_one({'username': username}) is not None
        return False
