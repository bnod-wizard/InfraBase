"""
Template Repository - Data access for template configurations with version history.
"""
from datetime import datetime, timezone


class TemplateRepository:

    def __init__(self, db):
        self.collection = db['templates']

    def find_all(self):
        return list(self.collection.find())

    def find_by_id(self, template_id):
        return self.collection.find_one({'template_id': template_id})

    def seed_defaults(self, defaults):
        """Insert default templates if missing; migrate legacy docs without versions."""
        for tid, data in defaults.items():
            existing = self.find_by_id(tid)
            if not existing:
                self.collection.insert_one(data)
            elif 'versions' not in existing:
                # Migrate: wrap legacy sections into version 1
                sections = existing.get('sections', [])
                self.collection.update_one(
                    {'template_id': tid},
                    {'$set': {
                        'is_custom': False,
                        'active_version': 1,
                        'versions': [{
                            'version': 1,
                            'label': 'Default',
                            'sections': sections,
                            'created_at': datetime.now(timezone.utc).isoformat(),
                        }],
                    }, '$unset': {'sections': ''}}
                )

    def push_version(self, template_id, version_obj):
        """Append a new version and set it as active."""
        self.collection.update_one(
            {'template_id': template_id},
            {
                '$push': {'versions': version_obj},
                '$set': {
                    'active_version': version_obj['version'],
                    'updated_at': datetime.now(timezone.utc),
                },
            }
        )

    def set_active_version(self, template_id, version_num):
        self.collection.update_one(
            {'template_id': template_id},
            {'$set': {'active_version': version_num, 'updated_at': datetime.now(timezone.utc)}}
        )

    def insert_custom(self, data):
        self.collection.insert_one(data)
        return self.find_by_id(data['template_id'])

    def delete_custom(self, template_id):
        result = self.collection.delete_one({'template_id': template_id, 'is_custom': True})
        return result.deleted_count > 0
