from bson import ObjectId
from datetime import datetime


class AccountDocumentRepository:
    def __init__(self, db):
        self.col = db['account_documents']
        self.col.create_index('account_id')

    def create(self, data):
        result = self.col.insert_one(data)
        return result.inserted_id

    def find_by_account(self, account_id):
        oid = ObjectId(str(account_id))
        docs = list(self.col.find({'account_id': oid, 'status': {'$ne': 'deleted'}}).sort('created_at', -1))
        return docs

    def find_by_id(self, doc_id):
        return self.col.find_one({'_id': ObjectId(str(doc_id))})

    def update_meta(self, doc_id, updates):
        updates['updated_at'] = datetime.utcnow()
        self.col.update_one({'_id': ObjectId(str(doc_id))}, {'$set': updates})

    def soft_delete(self, doc_id):
        self.col.update_one(
            {'_id': ObjectId(str(doc_id))},
            {'$set': {'status': 'deleted', 'updated_at': datetime.utcnow()}}
        )
