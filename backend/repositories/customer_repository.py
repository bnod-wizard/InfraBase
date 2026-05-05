"""
Customer Repository - Handles all database operations for customers
"""
from bson.objectid import ObjectId
from pymongo.errors import DuplicateKeyError
from datetime import datetime


class CustomerRepository:
    """Repository for customer collection operations"""
    
    def __init__(self, db):
        """
        Initialize repository with database connection
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.collection = db['customers']
        self._create_indexes()
    
    def _create_indexes(self):
        """Create necessary indexes"""
        self.collection.create_index('email')
        self.collection.create_index('company')
        self.collection.create_index('created_by')
        self.collection.create_index('status')
    
    def create_customer(self, customer_data, user_id):
        """
        Create a new customer
        
        Args:
            customer_data (dict): Customer data to insert
            user_id (str): User ID creating the customer
            
        Returns:
            str: Inserted customer ID
            
        Raises:
            Exception: If creation fails
        """
        try:
            customer_data['created_by'] = user_id
            customer_data['created_at'] = datetime.utcnow()
            customer_data['updated_at'] = datetime.utcnow()
            
            result = self.collection.insert_one(customer_data)
            return result.inserted_id
        except Exception as e:
            raise Exception(f"Failed to create customer: {str(e)}")
    
    def find_by_id(self, customer_id):
        """
        Find customer by ID
        
        Args:
            customer_id (str or ObjectId): Customer ID
            
        Returns:
            dict: Customer document or None
        """
        try:
            if isinstance(customer_id, str):
                customer_id = ObjectId(customer_id)
            return self.collection.find_one({'_id': customer_id})
        except Exception:
            return None
    
    def find_by_email(self, email):
        """
        Find customer by email
        
        Args:
            email (str): Customer email
            
        Returns:
            dict: Customer document or None
        """
        return self.collection.find_one({'email': email})
    
    def get_all_customers(self, user_id=None, skip=0, limit=100, status=None):
        """
        Get all customers with optional filtering
        
        Args:
            user_id (str): Optional - filter by user who created them
            skip (int): Number of documents to skip
            limit (int): Number of documents to return
            status (str): Optional - filter by status (active/inactive/prospect)
            
        Returns:
            tuple: (customers list, total count)
        """
        query = {}
        
        if user_id:
            query['created_by'] = user_id
        
        if status:
            query['status'] = status
        
        customers = list(
            self.collection.find(query)
            .sort('created_at', -1)
            .skip(skip)
            .limit(limit)
        )
        
        total_count = self.collection.count_documents(query)
        
        return customers, total_count
    
    def update_customer(self, customer_id, update_data):
        """
        Update customer by ID
        
        Args:
            customer_id (str or ObjectId): Customer ID
            update_data (dict): Data to update
            
        Returns:
            bool: True if updated, False otherwise
        """
        try:
            if isinstance(customer_id, str):
                customer_id = ObjectId(customer_id)
            
            update_data['updated_at'] = datetime.utcnow()
            
            result = self.collection.update_one(
                {'_id': customer_id},
                {'$set': update_data}
            )
            
            return result.modified_count > 0
        except Exception:
            return False
    
    def delete_customer(self, customer_id):
        """
        Delete customer by ID
        
        Args:
            customer_id (str or ObjectId): Customer ID
            
        Returns:
            bool: True if deleted, False otherwise
        """
        try:
            if isinstance(customer_id, str):
                customer_id = ObjectId(customer_id)
            
            result = self.collection.delete_one({'_id': customer_id})
            return result.deleted_count > 0
        except Exception:
            return False
    
    def search_customers(self, search_query, user_id=None):
        """
        Search customers by name, email, or company
        
        Args:
            search_query (str): Search term
            user_id (str): Optional - filter by user who created them
            
        Returns:
            list: Matching customers
        """
        query = {
            '$or': [
                {'name': {'$regex': search_query, '$options': 'i'}},
                {'email': {'$regex': search_query, '$options': 'i'}},
                {'company': {'$regex': search_query, '$options': 'i'}},
                {'phone': {'$regex': search_query, '$options': 'i'}}
            ]
        }
        
        if user_id:
            query['created_by'] = user_id
        
        return list(self.collection.find(query).sort('name', 1))
    
    def get_customers_by_status(self, status, user_id=None):
        """
        Get customers filtered by status
        
        Args:
            status (str): Status to filter (active/inactive/prospect)
            user_id (str): Optional - filter by user who created them
            
        Returns:
            list: Customers with given status
        """
        query = {'status': status}
        
        if user_id:
            query['created_by'] = user_id
        
        return list(self.collection.find(query).sort('name', 1))
    
    def get_customer_count(self, user_id=None):
        """
        Get total count of customers
        
        Args:
            user_id (str): Optional - count for specific user
            
        Returns:
            int: Total customer count
        """
        query = {}
        if user_id:
            query['created_by'] = user_id
        
        return self.collection.count_documents(query)
