from bson import ObjectId
from datetime import datetime


class AccountReviewRepository:

    def __init__(self, db):
        self.col = db['account_reviews']

    def create(self, data):
        result = self.col.insert_one(data)
        return result.inserted_id

    def find_by_account(self, account_id):
        return self.col.find_one({'account_id': str(account_id)}, sort=[('assigned_at', -1)])

    def find_by_reviewer(self, reviewer_id):
        """All active (pending) review assignments for a reviewer."""
        return list(self.col.find(
            {'reviewer_id': str(reviewer_id), 'status': 'pending'},
            sort=[('assigned_at', -1)],
        ))

    def find_all_active(self):
        """All pending reviews — for admins."""
        return list(self.col.find({'status': 'pending'}, sort=[('assigned_at', -1)]))

    def upsert_for_account(self, account_id, data):
        """Replace existing assignment for account (one active review at a time)."""
        self.col.update_one(
            {'account_id': str(account_id)},
            {'$set': data},
            upsert=True,
        )

    def mark_approved(self, account_id, approved_by, approved_by_name, note=''):
        self.col.update_one(
            {'account_id': str(account_id)},
            {'$set': {
                'status':           'approved',
                'approved_by':      approved_by,
                'approved_by_name': approved_by_name,
                'approved_at':      datetime.utcnow(),
                'note':             note,
            }},
        )
