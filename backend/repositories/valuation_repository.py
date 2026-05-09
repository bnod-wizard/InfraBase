"""
Valuation Repository - Data access for ValuationReport
"""
from bson import ObjectId


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
