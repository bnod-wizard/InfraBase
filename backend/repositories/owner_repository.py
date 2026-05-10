"""
Owner Repository - Data access layer for Owner model
"""
from bson import ObjectId
from datetime import datetime


class OwnerRepository:
    """Repository for Owner CRUD operations"""

    def __init__(self, db):
        self.db = db
        self.collection = db['owners']

    def create_owner(self, owner_data):
        """Create a new owner"""
        try:
            result = self.collection.insert_one(owner_data)
            return result.inserted_id
        except Exception as e:
            raise Exception(f"Error creating owner: {str(e)}")

    def find_by_id(self, owner_id):
        """Find owner by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(owner_id)})
        except Exception as e:
            raise Exception(f"Error finding owner: {str(e)}")

    def find_by_property(self, property_id, skip=0, limit=10):
        """Find all owners for a property"""
        try:
            return list(self.collection.find({'owner_id': ObjectId(property_id)}).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error finding owners by property: {str(e)}")

    def find_by_account(self, account_id, skip=0, limit=10):
        """Find all owners for an account"""
        try:
            return list(self.collection.find({'account_id': ObjectId(account_id)}).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error finding owners by account: {str(e)}")

    def get_total_count_by_property(self, property_id):
        """Get total count of owners for a property"""
        try:
            return self.collection.count_documents({'owner_id': ObjectId(property_id)})
        except Exception as e:
            raise Exception(f"Error counting owners: {str(e)}")

    def find_all(self, skip=0, limit=10):
        """Get all owners with pagination"""
        try:
            return list(self.collection.find().skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error fetching owners: {str(e)}")

    def update_owner(self, owner_id, owner_data):
        """Update owner"""
        try:
            result = self.collection.update_one(
                {'_id': ObjectId(owner_id)},
                {'$set': owner_data}
            )
            return result.matched_count > 0
        except Exception as e:
            raise Exception(f"Error updating owner: {str(e)}")

    def delete_owner(self, owner_id):
        """Delete owner"""
        try:
            result = self.collection.delete_one({'_id': ObjectId(owner_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting owner: {str(e)}")

    def search_owners(self, query, account_id=None, skip=0, limit=10):
        """Search owners by name or email"""
        try:
            search_filter = {
                '$or': [
                    {'owner_name': {'$regex': query, '$options': 'i'}},
                    {'email': {'$regex': query, '$options': 'i'}},
                    {'pan_number': {'$regex': query, '$options': 'i'}}
                ]
            }
            if account_id:
                search_filter['account_id'] = ObjectId(account_id)
            
            return list(self.collection.find(search_filter).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error searching owners: {str(e)}")

    def get_by_email(self, email):
        """Find owner by email"""
        try:
            return self.collection.find_one({'email': email})
        except Exception as e:
            raise Exception(f"Error finding owner by email: {str(e)}")
