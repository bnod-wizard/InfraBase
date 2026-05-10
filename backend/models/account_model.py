"""
Account Model - Company/Organization level
"""
from datetime import datetime


class AccountModel:
    """Account Model - Company/Organization level"""
    
    @staticmethod
    def _safe_iso(value):
        return value.isoformat() if hasattr(value, 'isoformat') else value

    @staticmethod
    def to_dict(account_data):
        """Convert account data to dictionary for database storage"""
        return {
            'account_name': account_data.get('account_name'),
            'company_registration': account_data.get('company_registration'),
            'registration_number': account_data.get('registration_number'),
            'tax_id': account_data.get('tax_id'),
            'business_type': account_data.get('business_type'),
            'phone': account_data.get('phone'),
            'email': account_data.get('email'),
            'website': account_data.get('website'),
            'address': account_data.get('address'),
            'city': account_data.get('city'),
            'state': account_data.get('state'),
            'zip_code': account_data.get('zip_code'),
            'country': account_data.get('country'),
            'logo_url': account_data.get('logo_url'),
            'status': account_data.get('status', 'Active'),
            'created_by': account_data.get('created_by'),
            'created_at': account_data.get('created_at', datetime.utcnow()),
            'updated_at': datetime.utcnow()
        }

    @staticmethod
    def to_json(account_data):
        """Convert account data to JSON for API response"""
        if '_id' in account_data:
            account_data['_id'] = str(account_data['_id'])
        if 'created_at' in account_data:
            account_data['created_at'] = AccountModel._safe_iso(account_data['created_at'])
        if 'updated_at' in account_data:
            account_data['updated_at'] = AccountModel._safe_iso(account_data['updated_at'])
        return account_data

    @staticmethod
    def from_dict(data):
        """Create account object from database data"""
        return {
            '_id': data.get('_id'),
            'account_name': data.get('account_name'),
            'company_registration': data.get('company_registration'),
            'registration_number': data.get('registration_number'),
            'tax_id': data.get('tax_id'),
            'business_type': data.get('business_type'),
            'phone': data.get('phone'),
            'email': data.get('email'),
            'website': data.get('website'),
            'address': data.get('address'),
            'city': data.get('city'),
            'state': data.get('state'),
            'zip_code': data.get('zip_code'),
            'country': data.get('country'),
            'logo_url': data.get('logo_url'),
            'status': data.get('status'),
            'created_by': data.get('created_by'),
            'created_at': data.get('created_at'),
            'updated_at': data.get('updated_at')
        }
