from datetime import datetime


class AccountChangelogModel:
    def __init__(self, db):
        self.collection = db['account_changelogs']

    def insert_log(self, account_id, old_status, new_status,
                   changed_by=None, changed_by_name=None,
                   account_name=None, note=None):
        log = {
            'account_id':      account_id,
            'account_name':    account_name,
            'old_status':      old_status,
            'new_status':      new_status,
            'changed_at':      datetime.utcnow(),
            'changed_by':      changed_by,
            'changed_by_name': changed_by_name,
            'note':            note,
        }
        return self.collection.insert_one(log)
