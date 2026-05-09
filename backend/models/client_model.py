"""
Client Model - Contact person within Account
"""
from datetime import datetime


class ClientModel:
    """Client Model - Contact person within Account"""
    
    @staticmethod
    def _safe_iso(value):
        return value.isoformat() if hasattr(value, 'isoformat') else value

    @staticmethod
    def to_dict(client_data):
        """Convert client data to dictionary for database storage"""
        return {
            'account_id': client_data.get('account_id'),
            'first_name': client_data.get('first_name'),
            'last_name': client_data.get('last_name'),
            'title': client_data.get('title'),  # e.g., Mr., Ms., Dr.
            'designation': client_data.get('designation'),  # e.g., Manager, Director
            'email': client_data.get('email'),
            'phone': client_data.get('phone'),
            'mobile': client_data.get('mobile'),
            'fax': client_data.get('fax'),
            'address': client_data.get('address'),
            'city': client_data.get('city'),
            'state': client_data.get('state'),
            'zip_code': client_data.get('zip_code'),
            'country': client_data.get('country'),
            'notes': client_data.get('notes'),
            'status': client_data.get('status', 'active'),
            'created_by': client_data.get('created_by'),
            'created_at': client_data.get('created_at', datetime.utcnow()),
            'updated_at': datetime.utcnow()
        }

    @staticmethod
    def to_json(client_data):
        """Convert client data to JSON for API response"""
        if '_id' in client_data:
            client_data['_id'] = str(client_data['_id'])
        if 'account_id' in client_data:
            client_data['account_id'] = str(client_data['account_id'])
        if 'created_at' in client_data:
            client_data['created_at'] = ClientModel._safe_iso(client_data['created_at'])
        if 'updated_at' in client_data:
            client_data['updated_at'] = ClientModel._safe_iso(client_data['updated_at'])
        return client_data

    @staticmethod
    def from_dict(data):
        """Create client object from database data"""
        return {
            '_id': data.get('_id'),
            'account_id': data.get('account_id'),
            'first_name': data.get('first_name'),
            'last_name': data.get('last_name'),
            'title': data.get('title'),
            'designation': data.get('designation'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'mobile': data.get('mobile'),
            'fax': data.get('fax'),
            'address': data.get('address'),
            'city': data.get('city'),
            'state': data.get('state'),
            'zip_code': data.get('zip_code'),
            'country': data.get('country'),
            'notes': data.get('notes'),
            'status': data.get('status'),
            'created_by': data.get('created_by'),
            'created_at': data.get('created_at'),
            'updated_at': data.get('updated_at')
        }
