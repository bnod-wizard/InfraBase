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
            'title': client_data.get('title'),
            'designation': client_data.get('designation'),
            'entity_type': client_data.get('entity_type', 'individual'),  # individual, company
            'email': client_data.get('email'),
            'phone': client_data.get('phone'),
            'mobile': client_data.get('mobile'),
            'fax': client_data.get('fax'),
            'address': client_data.get('address'),
            'ward_no': client_data.get('ward_no'),
            'vdc_municipality': client_data.get('vdc_municipality'),
            'district': client_data.get('district'),
            'city': client_data.get('city'),
            'state': client_data.get('state'),
            'zip_code': client_data.get('zip_code'),
            'country': client_data.get('country'),
            # Individual identity
            'citizenship_no': client_data.get('citizenship_no'),
            'citizenship_issued_date': client_data.get('citizenship_issued_date'),
            'citizenship_issued_office': client_data.get('citizenship_issued_office'),
            'father_name': client_data.get('father_name'),
            'grandfather_name': client_data.get('grandfather_name'),
            'husband_name': client_data.get('husband_name'),
            'pan_no': client_data.get('pan_no'),
            # Company identity
            'company_registration_no': client_data.get('company_registration_no'),
            'company_reg_issued_date': client_data.get('company_reg_issued_date'),
            'company_reg_issued_office': client_data.get('company_reg_issued_office'),
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
