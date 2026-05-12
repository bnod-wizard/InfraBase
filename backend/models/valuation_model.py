"""
Valuation Model - Certification/report metadata for a property valuation
"""
from datetime import datetime


class ValuationModel:

    @staticmethod
    def _safe_iso(value):
        return value.isoformat() if hasattr(value, 'isoformat') else value

    @staticmethod
    def to_dict(data):
        return {
            'account_id': data.get('account_id'),
            'property_id': data.get('property_id'),
            'ref_no': data.get('ref_no'),
            'fiscal_year': data.get('fiscal_year'),
            'inspection_date': data.get('inspection_date'),
            'certification_date': data.get('certification_date'),
            # Bank / recipient
            'bank_id': data.get('bank_id'),
            'bank_name': data.get('bank_name'),
            'bank_branch': data.get('bank_branch'),
            'bank_address': data.get('bank_address'),
            # Certifier
            'certifier_id': data.get('certifier_id'),
            'certifier_name': data.get('certifier_name'),
            'certifier_phone': data.get('certifier_phone'),
            'nec_no': data.get('nec_no'),
            'nec_class': data.get('nec_class', 'A'),
            'nec_type': data.get('nec_type', 'Civil'),
            'firm_name': data.get('firm_name'),
            'firm_address': data.get('firm_address'),
            'firm_phone': data.get('firm_phone'),
            'firm_email': data.get('firm_email'),
            # Site visit
            'visitor_id': data.get('visitor_id'),
            'site_visited_by': data.get('site_visited_by'),
            'site_visitor_phone': data.get('site_visitor_phone'),
            'remarks': data.get('remarks'),
            # Document scope selections
            'selected_client_ids': data.get('selected_client_ids') or [],
            'selected_owner_ids': data.get('selected_owner_ids') or [],
            'selected_property_id': data.get('selected_property_id') or '',
            'status': data.get('status', 'draft'),
            'created_by': data.get('created_by'),
            'created_at': data.get('created_at', datetime.utcnow()),
            'updated_at': datetime.utcnow()
        }

    @staticmethod
    def to_json(data):
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'account_id' in data:
            data['account_id'] = str(data['account_id'])
        if data.get('property_id'):
            data['property_id'] = str(data['property_id'])
        if 'created_at' in data:
            data['created_at'] = ValuationModel._safe_iso(data['created_at'])
        if 'updated_at' in data:
            data['updated_at'] = ValuationModel._safe_iso(data['updated_at'])
        return data
