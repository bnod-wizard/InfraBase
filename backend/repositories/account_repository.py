"""
Account Repository - Data access layer for Account model
"""
import re
from bson import ObjectId
from datetime import datetime
from models.account_changelog_model import AccountChangelogModel


class AccountRepository:
    """Repository for Account CRUD operations"""

    def __init__(self, db):
        self.db = db
        self.collection = db['accounts']
        self.changelog_model = AccountChangelogModel(db)

    def create_account(self, account_data, changed_by_name=None):
        """Create a new account"""
        try:
            result = self.collection.insert_one(account_data)
            account_id = result.inserted_id
            self.changelog_model.insert_log(
                str(account_id),
                old_status=None,
                new_status=account_data.get('status', 'Active'),
                changed_by=account_data.get('created_by'),
                changed_by_name=changed_by_name,
                account_name=account_data.get('account_name'),
                note='Account created',
            )
            return account_id
        except Exception as e:
            raise Exception(f"Error creating account: {str(e)}")

    def find_by_id(self, account_id):
        """Find account by ID"""
        try:
            return self.collection.find_one({'_id': ObjectId(account_id)})
        except Exception as e:
            raise Exception(f"Error finding account: {str(e)}")

    def get_by_email(self, email):
        """Find account by email"""
        try:
            return self.collection.find_one({'email': email})
        except Exception as e:
            raise Exception(f"Error finding account by email: {str(e)}")

    def find_all(self, skip=0, limit=10):
        """Get all accounts with pagination"""
        try:
            return list(self.collection.find().sort('created_at', -1).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error fetching accounts: {str(e)}")

    def get_total_count(self):
        """Get total count of accounts"""
        try:
            return self.collection.count_documents({})
        except Exception as e:
            raise Exception(f"Error counting accounts: {str(e)}")

    def update_account(self, account_id, account_data, changed_by=None, changed_by_name=None):
        """Update account"""
        try:
            current_account = self.collection.find_one({'_id': ObjectId(account_id)})
            old_status   = current_account.get('status')   if current_account else None
            account_name = current_account.get('account_name') if current_account else None
            new_status   = account_data.get('status')

            result = self.collection.update_one(
                {'_id': ObjectId(account_id)},
                {'$set': account_data}
            )

            if old_status != new_status and new_status is not None:
                self.changelog_model.insert_log(
                    account_id,
                    old_status=old_status,
                    new_status=new_status,
                    changed_by=changed_by,
                    changed_by_name=changed_by_name,
                    account_name=account_name,
                )

            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating account: {str(e)}")

    def delete_account(self, account_id, changed_by=None, changed_by_name=None):
        """Soft delete account by setting status to Deleted"""
        try:
            current_account = self.collection.find_one({'_id': ObjectId(account_id)})
            old_status   = current_account.get('status')       if current_account else None
            account_name = current_account.get('account_name') if current_account else None

            result = self.collection.update_one(
                {'_id': ObjectId(account_id)},
                {'$set': {'status': 'Deleted', 'updated_at': datetime.utcnow()}}
            )

            if old_status != 'Deleted':
                self.changelog_model.insert_log(
                    account_id,
                    old_status=old_status,
                    new_status='Deleted',
                    changed_by=changed_by,
                    changed_by_name=changed_by_name,
                    account_name=account_name,
                    note='Account marked as Deleted',
                )

            return result.modified_count > 0
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
            return list(self.collection.find(search_filter).sort('created_at', -1).skip(skip).limit(limit))
        except Exception as e:
            raise Exception(f"Error searching accounts: {str(e)}")

    def get_accounts_with_filters(self, query='', status_filters=None, skip=0, limit=10):
        """Get accounts with combined search and status filters"""
        try:
            filters = []
            
            # Add search filter if query is provided
            if query and query.strip():
                search_filter = {
                    '$or': [
                        {'account_name': {'$regex': query, '$options': 'i'}},
                        {'email': {'$regex': query, '$options': 'i'}},
                        {'tax_id': {'$regex': query, '$options': 'i'}}
                    ]
                }
                filters.append(search_filter)
            
            if status_filters and len(status_filters) > 0:
                status_conditions = [
                    {'status': {'$regex': f'^{re.escape(s)}$', '$options': 'i'}}
                    for s in status_filters
                ]
                filters.append({'$or': status_conditions} if len(status_conditions) > 1 else status_conditions[0])
            
            # Combine all filters with AND
            if filters:
                if len(filters) == 1:
                    query_filter = filters[0]
                else:
                    query_filter = {'$and': filters}
            else:
                query_filter = {}
            
            accounts = list(self.collection.find(query_filter).sort('created_at', -1).skip(skip).limit(limit))
            total = self.collection.count_documents(query_filter)
            
            return accounts, total
        except Exception as e:
            raise Exception(f"Error fetching accounts with filters: {str(e)}")

    def get_status_counts(self):
        """Get count of accounts grouped by status"""
        try:
            pipeline = [{'$group': {'_id': '$status', 'count': {'$sum': 1}}}]
            results = list(self.collection.aggregate(pipeline))
            return {item['_id']: item['count'] for item in results if item['_id']}
        except Exception as e:
            raise Exception(f"Error aggregating status counts: {str(e)}")

    def get_changelog(self, account_id, limit=50):
        """Get changelog for an account"""
        try:
            return list(self.changelog_model.collection.find({'account_id': account_id}).sort('changed_at', -1).limit(limit))
        except Exception as e:
            raise Exception(f"Error fetching changelog: {str(e)}")

    def get_monthly_counts(self, start_date):
        """Count accounts created per month from start_date"""
        try:
            pipeline = [
                {'$match': {'created_at': {'$gte': start_date}}},
                {
                    '$group': {
                        '_id': {
                            'year':  {'$year':  '$created_at'},
                            'month': {'$month': '$created_at'}
                        },
                        'count': {'$sum': 1}
                    }
                },
                {'$sort': {'_id.year': 1, '_id.month': 1}}
            ]
            return list(self.collection.aggregate(pipeline))
        except Exception as e:
            raise Exception(f"Error aggregating monthly counts: {str(e)}")

    def get_recent_changelogs(self, limit=20):
        """Get most recent changelog entries across all accounts"""
        try:
            return list(self.changelog_model.collection.find().sort('changed_at', -1).limit(limit))
        except Exception as e:
            raise Exception(f"Error fetching recent changelogs: {str(e)}")
