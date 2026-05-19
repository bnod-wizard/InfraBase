from bson import ObjectId
from datetime import datetime


class NotificationRepository:

    def __init__(self, db):
        self.col = db['notifications']

    def create(self, user_id, title, description, redirect_path):
        doc = {
            'user_id':       str(user_id),
            'title':         title,
            'description':   description,
            'redirect_path': redirect_path,
            'status':        'unread',   # unread | read | deleted
            'created_at':    datetime.utcnow(),
        }
        result = self.col.insert_one(doc)
        doc['_id'] = result.inserted_id
        return doc

    def find_by_user(self, user_id, limit=50):
        """All non-deleted notifications for a user, newest first."""
        return list(self.col.find(
            {'user_id': str(user_id), 'status': {'$ne': 'deleted'}},
            sort=[('created_at', -1)],
        ).limit(limit))

    def find_since(self, user_id, since_dt):
        """New non-deleted notifications created after since_dt."""
        return list(self.col.find(
            {'user_id': str(user_id), 'status': {'$ne': 'deleted'}, 'created_at': {'$gt': since_dt}},
            sort=[('created_at', 1)],
        ))

    def count_unread(self, user_id):
        return self.col.count_documents({'user_id': str(user_id), 'status': 'unread'})

    def mark_read(self, notification_id, user_id):
        self.col.update_one(
            {'_id': ObjectId(notification_id), 'user_id': str(user_id)},
            {'$set': {'status': 'read'}},
        )

    def mark_all_read(self, user_id):
        self.col.update_many(
            {'user_id': str(user_id), 'status': 'unread'},
            {'$set': {'status': 'read'}},
        )

    def delete_notification(self, notification_id, user_id):
        self.col.update_one(
            {'_id': ObjectId(notification_id), 'user_id': str(user_id)},
            {'$set': {'status': 'deleted'}},
        )
