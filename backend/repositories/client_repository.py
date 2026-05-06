"""
Client Repository - Data access layer for Client model
"""
from bson import ObjectId
from datetime import datetime


class ClientRepository:
    """Repository for Client CRUD operations"""

    def __init__(self, db):
        self.db = db
        self.collection = db['clients']

    def create_client(self, client_data):
        """Create a new client"""
        try:
            result = self.collection.insert_one(client_data)
            return result.inserted_id
        except Exception as e:
            raise Exception(f"Error creating client: {str(e)}")

    def find_by_id(self, client_id):
        """Find client by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(client_id)})
        except Exception as e:
            raise Exception(f"Error finding client: {str(e)}")

    def find_by_account(self, account_id, skip=0, limit=10):
        """Find all clients for an account"""
        try:
            return list(self.collection.find({'account_id': ObjectId(account_id)}).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error finding clients by account: {str(e)}")

    def get_total_count_by_account(self, account_id):
        """Get total count of clients for an account"""
        try:
            return self.collection.count_documents({'account_id': ObjectId(account_id)})
        except Exception as e:
            raise Exception(f"Error counting clients: {str(e)}")

    def find_all(self, skip=0, limit=10):
        """Get all clients with pagination"""
        try:
            return list(self.collection.find().skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error fetching clients: {str(e)}")

    def update_client(self, client_id, client_data):
        """Update client"""
        try:
            result = self.collection.update_one(
                {'_id': ObjectId(client_id)},
                {'$set': client_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating client: {str(e)}")

    def delete_client(self, client_id):
        """Delete client"""
        try:
            result = self.collection.delete_one({'_id': ObjectId(client_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting client: {str(e)}")

    def search_clients(self, query, account_id=None, skip=0, limit=10):
        """Search clients by name or email"""
        try:
            search_filter = {
                '$or': [
                    {'first_name': {'$regex': query, '$options': 'i'}},
                    {'last_name': {'$regex': query, '$options': 'i'}},
                    {'email': {'$regex': query, '$options': 'i'}}
                ]
            }
            if account_id:
                search_filter['account_id'] = ObjectId(account_id)
            
            return list(self.collection.find(search_filter).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error searching clients: {str(e)}")

    def get_by_email(self, email):
        """Find client by email"""
        try:
            return self.collection.find_one({'email': email})
        except Exception as e:
            raise Exception(f"Error finding client by email: {str(e)}")
