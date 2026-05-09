"""
Account Repository - Data access layer for Account model
"""
from bson import ObjectId
from datetime import datetime


class AccountRepository:
    """Repository for Account CRUD operations"""

    def __init__(self, db):
        self.db = db
        self.collection = db['accounts']

    def create_account(self, account_data):
        """Create a new account"""
        try:
            result = self.collection.insert_one(account_data)
            return result.inserted_id
        except Exception as e:
            raise Exception(f"Error creating account: {str(e)}")

    def find_by_id(self, account_id):
        """Find account by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(account_id)})
        except Exception as e:
            raise Exception(f"Error finding account: {str(e)}")

    def find_all(self, skip=0, limit=10):
        """Get all accounts with pagination"""
        try:
            return list(self.collection.find().skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error fetching accounts: {str(e)}")

    def get_total_count(self):
        """Get total count of accounts"""
        try:
            return self.collection.count_documents({})
        except Exception as e:
            raise Exception(f"Error counting accounts: {str(e)}")

    def update_account(self, account_id, account_data):
        """Update account"""
        try:
            result = self.collection.update_one(
                {'_id': ObjectId(account_id)},
                {'$set': account_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating account: {str(e)}")

    def delete_account(self, account_id):
        """Delete account"""
        try:
            result = self.collection.delete_one({'_id': ObjectId(account_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting account: {str(e)}")

    def search_accounts(self, query, skip=0, limit=10):
        """Search accounts by name or email"""
        try:
            search_filter = {
                '$or': [
                    {'account_name': {'$regex': query, '$options': 'i'}},
                    {'email': {'$regex': query, '$options': 'i'}},
                    {'tax_id': {'$regex': query, '$options': 'i'}}
                ]
            }
            return list(self.collection.find(search_filter).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error searching accounts: {str(e)}")

    def get_status_counts(self):
        """Get count of accounts grouped by status"""
        try:
            pipeline = [{'$group': {'_id': '$status', 'count': {'$sum': 1}}}]
            results = list(self.collection.aggregate(pipeline))
            return {item['_id']: item['count'] for item in results if item['_id']}
        except Exception as e:
            raise Exception(f"Error aggregating status counts: {str(e)}")

    def get_by_email(self, email):
        """Find account by email"""
        try:
            return self.collection.find_one({'email': email})
        except Exception as e:
            raise Exception(f"Error finding account by email: {str(e)}")
