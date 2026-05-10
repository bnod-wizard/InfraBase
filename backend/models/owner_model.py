"""
Owner Model - Property owner (can be individual or entity)
"""
from datetime import datetime
from bson import ObjectId


def _to_oid(val):
    if val is None: return None
    if isinstance(val, ObjectId): return val
    try: return ObjectId(str(val))
    except Exception: return None


class OwnerModel:
    """Owner Model - Property owner (can be individual or entity)"""
    
    @staticmethod
    def _safe_iso(value):
        return value.isoformat() if hasattr(value, 'isoformat') else value

    @staticmethod
    def to_dict(owner_data):
        """Convert owner data to dictionary for database storage"""
        return {
            'account_id': _to_oid(owner_data.get('account_id')),
            'client_id':  _to_oid(owner_data.get('client_id')),
            'owner_name': owner_data.get('owner_name'),
            'owner_type': owner_data.get('owner_type', 'individual'),
            'title': owner_data.get('title'),
            'email': owner_data.get('email'),
            'phone': owner_data.get('phone'),
            'mobile': owner_data.get('mobile'),
            'fax': owner_data.get('fax'),
            'address': owner_data.get('address'),
            'ward_no': owner_data.get('ward_no'),
            'vdc_municipality': owner_data.get('vdc_municipality'),
            'district': owner_data.get('district'),
            'city': owner_data.get('city'),
            'state': owner_data.get('state'),
            'zip_code': owner_data.get('zip_code'),
            'country': owner_data.get('country'),
            # Identity fields
            'citizenship_no': owner_data.get('citizenship_no'),
            'citizenship_issued_date': owner_data.get('citizenship_issued_date'),
            'citizenship_issued_office': owner_data.get('citizenship_issued_office'),
            'father_name': owner_data.get('father_name'),
            'grandfather_name': owner_data.get('grandfather_name'),
            'husband_name': owner_data.get('husband_name'),
            'id_type': owner_data.get('id_type'),
            'id_number': owner_data.get('id_number'),
            'pan_number': owner_data.get('pan_number'),
            'bank_account': owner_data.get('bank_account'),
            'bank_name': owner_data.get('bank_name'),
            'ifsc_code': owner_data.get('ifsc_code'),
            'notes': owner_data.get('notes'),
            'status': owner_data.get('status', 'active'),
            'created_by': owner_data.get('created_by'),
            'created_at': owner_data.get('created_at', datetime.utcnow()),
            'updated_at': datetime.utcnow()
        }

    @staticmethod
    def to_json(owner_data):
        """Convert owner data to JSON for API response"""
        if '_id' in owner_data:
            owner_data['_id'] = str(owner_data['_id'])
        if 'account_id' in owner_data:
            owner_data['account_id'] = str(owner_data['account_id'])
        if 'client_id' in owner_data and owner_data['client_id']:
            owner_data['client_id'] = str(owner_data['client_id'])
        if 'created_at' in owner_data:
            owner_data['created_at'] = OwnerModel._safe_iso(owner_data['created_at'])
        if 'updated_at' in owner_data:
            owner_data['updated_at'] = OwnerModel._safe_iso(owner_data['updated_at'])
        return owner_data

    @staticmethod
    def from_dict(data):
        """Create owner object from database data"""
        return {
            '_id': data.get('_id'),
            'account_id': data.get('account_id'),
            'client_id': data.get('client_id'),
            'owner_name': data.get('owner_name'),
            'owner_type': data.get('owner_type'),
            'title': data.get('title'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'mobile': data.get('mobile'),
            'fax': data.get('fax'),
            'address': data.get('address'),
            'city': data.get('city'),
            'state': data.get('state'),
            'zip_code': data.get('zip_code'),
            'country': data.get('country'),
            'id_type': data.get('id_type'),
            'id_number': data.get('id_number'),
            'pan_number': data.get('pan_number'),
            'bank_account': data.get('bank_account'),
            'bank_name': data.get('bank_name'),
            'ifsc_code': data.get('ifsc_code'),
            'notes': data.get('notes'),
            'status': data.get('status'),
            'created_by': data.get('created_by'),
            'created_at': data.get('created_at'),
            'updated_at': data.get('updated_at')
        }
