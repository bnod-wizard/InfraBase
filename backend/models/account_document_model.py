from datetime import datetime
from bson import ObjectId


def _to_oid(val):
    if val is None: return None
    if isinstance(val, ObjectId): return val
    try: return ObjectId(str(val))
    except Exception: return None


class AccountDocumentModel:

    @staticmethod
    def _safe_iso(value):
        return value.isoformat() if hasattr(value, 'isoformat') else value

    @staticmethod
    def to_dict(data):
        return {
            'account_id':     _to_oid(data.get('account_id')),
            'original_name':  data.get('original_name', ''),
            'stored_name':    data.get('stored_name', ''),
            'doc_type':       data.get('doc_type', 'other'),
            'description':    data.get('description', ''),
            'mime_type':      data.get('mime_type', ''),
            'file_size':      data.get('file_size', 0),
            'file_ext':       data.get('file_ext', ''),
            'storage_path':   data.get('storage_path', ''),
            'storage_backend':data.get('storage_backend', 'local'),
            'url':            data.get('url', ''),
            'uploaded_by':    data.get('uploaded_by', ''),
            'uploaded_by_name': data.get('uploaded_by_name', ''),
            'tags':           data.get('tags', []),
            'status':         data.get('status', 'active'),
            'created_at':     data.get('created_at', datetime.utcnow()),
            'updated_at':     datetime.utcnow(),
        }

    @staticmethod
    def to_json(doc):
        doc = dict(doc)
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
        if 'account_id' in doc and doc['account_id']:
            doc['account_id'] = str(doc['account_id'])
        if 'created_at' in doc:
            doc['created_at'] = AccountDocumentModel._safe_iso(doc['created_at'])
        if 'updated_at' in doc:
            doc['updated_at'] = AccountDocumentModel._safe_iso(doc['updated_at'])
        return doc
