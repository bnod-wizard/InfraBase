"""
Valuation Repository - Data access for ValuationReport
"""
from bson import ObjectId
from datetime import datetime


class ValuationRepository:

    def __init__(self, db):
        self.collection = db['valuations']

    def create(self, data):
        result = self.collection.insert_one(data)
        return result.inserted_id

    def find_by_account(self, account_id):
        return list(self.collection.find({'account_id': str(account_id)}))

    def find_by_id(self, valuation_id):
        return self.collection.find_one({'_id': ObjectId(valuation_id)})

    def upsert_for_account(self, account_id, data):
        """Replace the single valuation record for an account (or insert)."""
        result = self.collection.replace_one(
            {'account_id': str(account_id)},
            data,
            upsert=True
        )
        if result.upserted_id:
            return result.upserted_id
        existing = self.collection.find_one({'account_id': str(account_id)})
        return existing['_id']

    def delete(self, valuation_id):
        result = self.collection.delete_one({'_id': ObjectId(valuation_id)})
        return result.deleted_count > 0

    # ── Approval workflow ──────────────────────────────────────────────────

    def update_approval(self, valuation_id, approval_status, history_entry, extra_fields=None):
        """Set approval_status, append a history entry, update updated_at."""
        update = {
            '$set': {
                'approval_status': approval_status,
                'updated_at': datetime.utcnow(),
                **(extra_fields or {}),
            },
            '$push': {'approval_history': history_entry},
        }
        self.collection.update_one({'_id': ObjectId(valuation_id)}, update)

    def find_by_approval_status(self, statuses, created_by=None):
        """Return valuations whose approval_status is in the given list."""
        query = {'approval_status': {'$in': statuses}}
        if created_by:
            query['created_by'] = created_by
        return list(self.collection.find(query).sort('updated_at', -1))

    def find_all_with_approval(self, created_by=None):
        """Return all valuations that have an approval_status field."""
        query = {'approval_status': {'$exists': True}}
        if created_by:
            query['created_by'] = created_by
        return list(self.collection.find(query).sort('updated_at', -1))
