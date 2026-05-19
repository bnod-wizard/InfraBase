from datetime import datetime


class NoteRepository:

    def __init__(self, db):
        self.col = db['account_notes']

    def create(self, account_id, content, created_by, created_by_name, note_type='manual'):
        doc = {
            'account_id':       str(account_id),
            'content':          content,
            'created_by':       created_by,
            'created_by_name':  created_by_name,
            'type':             note_type,
            'created_at':       datetime.utcnow(),
        }
        result = self.col.insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    def find_by_account(self, account_id, limit=100):
        return list(self.col.find(
            {'account_id': str(account_id)},
            sort=[('created_at', -1)],
        ).limit(limit))
