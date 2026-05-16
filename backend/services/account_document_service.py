import os
import uuid
from datetime import datetime, timezone
from models.account_document_model import AccountDocumentModel

import boto3
from botocore.config import Config

R2_ACCESS_KEY  = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_KEY  = os.getenv('R2_SECRET_ACCESS_KEY')
R2_ENDPOINT    = os.getenv('R2_ENDPOINT')
R2_BUCKET      = os.getenv('R2_BUCKET', 'infrabase')

# Presigned URL expiry in seconds (1 hour)
PRESIGN_EXPIRY = 3600


def _r2_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto',
    )


class AccountDocumentService:
    def __init__(self, repo):
        self.repo = repo

    def upload(self, account_id, file_obj, doc_type, description, uploaded_by, uploaded_by_name):
        original_name = file_obj.filename
        ext = os.path.splitext(original_name)[1].lower()
        stored_name = f"accounts/{account_id}/{uuid.uuid4().hex}{ext}"
        mime_type = file_obj.content_type or 'application/octet-stream'

        client = _r2_client()
        file_obj.stream.seek(0)
        client.upload_fileobj(
            file_obj.stream,
            R2_BUCKET,
            stored_name,
            ExtraArgs={'ContentType': mime_type},
        )

        # Get file size from R2
        head = client.head_object(Bucket=R2_BUCKET, Key=stored_name)
        file_size = head.get('ContentLength', 0)

        data = {
            'account_id':       account_id,
            'original_name':    original_name,
            'stored_name':      stored_name,
            'doc_type':         doc_type or 'other',
            'description':      description or '',
            'mime_type':        mime_type,
            'file_size':        file_size,
            'file_ext':         ext.lstrip('.'),
            'storage_path':     stored_name,
            'storage_backend':  'r2',
            'url':              '',
            'uploaded_by':      uploaded_by,
            'uploaded_by_name': uploaded_by_name,
            'tags':             [],
            'status':           'active',
            'created_at':       datetime.utcnow(),
        }
        doc_dict = AccountDocumentModel.to_dict(data)
        inserted_id = self.repo.create(doc_dict)
        doc_dict['_id'] = inserted_id
        return AccountDocumentModel.to_json(doc_dict)

    def list_for_account(self, account_id):
        docs = self.repo.find_by_account(account_id)
        return [AccountDocumentModel.to_json(d) for d in docs]

    def get_presigned_url(self, doc_id, inline=False):
        """Return a short-lived presigned URL for download or inline view."""
        doc = self.repo.find_by_id(doc_id)
        if not doc:
            return None, None
        key = doc.get('storage_path') or doc.get('stored_name')
        original_name = doc.get('original_name', 'file')
        client = _r2_client()
        params = {
            'Bucket': R2_BUCKET,
            'Key': key,
        }
        if not inline:
            params['ResponseContentDisposition'] = f'attachment; filename="{original_name}"'
        url = client.generate_presigned_url(
            'get_object',
            Params=params,
            ExpiresIn=PRESIGN_EXPIRY,
        )
        return url, original_name

    def update_meta(self, doc_id, updates):
        allowed = {'doc_type', 'description', 'tags', 'original_name'}
        safe = {k: v for k, v in updates.items() if k in allowed}
        self.repo.update_meta(doc_id, safe)
        doc = self.repo.find_by_id(doc_id)
        return AccountDocumentModel.to_json(doc) if doc else None

    def delete(self, doc_id):
        doc = self.repo.find_by_id(doc_id)
        if not doc:
            return False
        key = doc.get('storage_path') or doc.get('stored_name')
        try:
            _r2_client().delete_object(Bucket=R2_BUCKET, Key=key)
        except Exception:
            pass
        self.repo.soft_delete(doc_id)
        return True

    def delete_meta_only(self, doc_id):
        """Remove metadata record only, leaving the file in R2 intact."""
        doc = self.repo.find_by_id(doc_id)
        if not doc:
            return False
        self.repo.soft_delete(doc_id)
        return True
