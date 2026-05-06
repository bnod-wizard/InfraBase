"""
Property Repository - Data access layer for Property model
"""
from bson import ObjectId
from datetime import datetime


class PropertyRepository:
    """Repository for Property CRUD operations"""

    def __init__(self, db):
        self.db = db
        self.collection = db['properties']

    def create_property(self, property_data):
        """Create a new property"""
        try:
            result = self.collection.insert_one(property_data)
            return result.inserted_id
        except Exception as e:
            raise Exception(f"Error creating property: {str(e)}")

    def find_by_id(self, property_id):
        """Find property by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(property_id)})
        except Exception as e:
            raise Exception(f"Error finding property: {str(e)}")

    def find_by_owner(self, owner_id, skip=0, limit=10):
        """Find all properties for an owner"""
        try:
            return list(self.collection.find({'owner_id': ObjectId(owner_id)}).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error finding properties by owner: {str(e)}")

    def find_by_account(self, account_id, skip=0, limit=10):
        """Find all properties for an account"""
        try:
            return list(self.collection.find({'account_id': ObjectId(account_id)}).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error finding properties by account: {str(e)}")

    def find_by_client(self, client_id, skip=0, limit=10):
        """Find all properties for a client"""
        try:
            return list(self.collection.find({'client_id': ObjectId(client_id)}).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error finding properties by client: {str(e)}")

    def get_total_count_by_account(self, account_id):
        """Get total count of properties for an account"""
        try:
            return self.collection.count_documents({'account_id': ObjectId(account_id)})
        except Exception as e:
            raise Exception(f"Error counting properties: {str(e)}")

    def find_all(self, skip=0, limit=10):
        """Get all properties with pagination"""
        try:
            return list(self.collection.find().skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error fetching properties: {str(e)}")

    def update_property(self, property_id, property_data):
        """Update property"""
        try:
            result = self.collection.update_one(
                {'_id': ObjectId(property_id)},
                {'$set': property_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating property: {str(e)}")

    def delete_property(self, property_id):
        """Delete property"""
        try:
            result = self.collection.delete_one({'_id': ObjectId(property_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting property: {str(e)}")

    def search_properties(self, query, account_id=None, skip=0, limit=10):
        """Search properties by name or address"""
        try:
            search_filter = {
                '$or': [
                    {'property_name': {'$regex': query, '$options': 'i'}},
                    {'address': {'$regex': query, '$options': 'i'}},
                    {'city': {'$regex': query, '$options': 'i'}},
                    {'survey_number': {'$regex': query, '$options': 'i'}}
                ]
            }
            if account_id:
                search_filter['account_id'] = ObjectId(account_id)
            
            return list(self.collection.find(search_filter).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error searching properties: {str(e)}")

    def find_by_type(self, property_type, account_id=None, skip=0, limit=10):
        """Find properties by type"""
        try:
            search_filter = {'property_type': property_type}
            if account_id:
                search_filter['account_id'] = ObjectId(account_id)
            
            return list(self.collection.find(search_filter).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error finding properties by type: {str(e)}")

    def find_by_status(self, status, account_id=None, skip=0, limit=10):
        """Find properties by status"""
        try:
            search_filter = {'property_status': status}
            if account_id:
                search_filter['account_id'] = ObjectId(account_id)
            
            return list(self.collection.find(search_filter).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error finding properties by status: {str(e)}")
