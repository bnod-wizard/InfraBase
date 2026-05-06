"""
Property Model - Physical asset/property
"""
from datetime import datetime


class PropertyModel:
    """Property Model - Physical asset/property"""
    
    @staticmethod
    def to_dict(property_data):
        """Convert property data to dictionary for database storage"""
        return {
            'account_id': property_data.get('account_id'),
            'client_id': property_data.get('client_id'),
            'owner_id': property_data.get('owner_id'),
            'property_name': property_data.get('property_name'),
            'property_type': property_data.get('property_type'),  # residential, commercial, industrial
            'property_status': property_data.get('property_status'),  # occupied, vacant, under_development
            'address': property_data.get('address'),
            'city': property_data.get('city'),
            'state': property_data.get('state'),
            'zip_code': property_data.get('zip_code'),
            'country': property_data.get('country'),
            'latitude': property_data.get('latitude'),
            'longitude': property_data.get('longitude'),
            'total_area': property_data.get('total_area'),  # in sq ft or sq meters
            'area_unit': property_data.get('area_unit'),  # sqft, sqm
            'built_area': property_data.get('built_area'),
            'carpet_area': property_data.get('carpet_area'),
            'land_area': property_data.get('land_area'),
            'number_of_units': property_data.get('number_of_units'),
            'bedrooms': property_data.get('bedrooms'),
            'bathrooms': property_data.get('bathrooms'),
            'parking_spaces': property_data.get('parking_spaces'),
            'construction_year': property_data.get('construction_year'),
            'property_age': property_data.get('property_age'),
            'facing': property_data.get('facing'),  # North, South, East, West
            'furnishing': property_data.get('furnishing'),  # Furnished, Semi-furnished, Unfurnished
            'amenities': property_data.get('amenities'),  # List of amenities
            'landmark': property_data.get('landmark'),
            'survey_number': property_data.get('survey_number'),
            'property_id_number': property_data.get('property_id_number'),  # Legal property ID
            'purchase_price': property_data.get('purchase_price'),
            'estimated_value': property_data.get('estimated_value'),
            'rental_value': property_data.get('rental_value'),
            'currency': property_data.get('currency', 'USD'),
            'documents': property_data.get('documents'),  # List of document references
            'photos': property_data.get('photos'),  # List of photo URLs
            'notes': property_data.get('notes'),
            'status': property_data.get('status', 'active'),
            'created_by': property_data.get('created_by'),
            'created_at': property_data.get('created_at', datetime.utcnow()),
            'updated_at': datetime.utcnow()
        }

    @staticmethod
    def to_json(property_data):
        """Convert property data to JSON for API response"""
        if '_id' in property_data:
            property_data['_id'] = str(property_data['_id'])
        if 'account_id' in property_data:
            property_data['account_id'] = str(property_data['account_id'])
        if 'client_id' in property_data:
            property_data['client_id'] = str(property_data['client_id'])
        if 'owner_id' in property_data:
            property_data['owner_id'] = str(property_data['owner_id'])
        if 'created_at' in property_data:
            property_data['created_at'] = property_data['created_at'].isoformat()
        if 'updated_at' in property_data:
            property_data['updated_at'] = property_data['updated_at'].isoformat()
        return property_data

    @staticmethod
    def from_dict(data):
        """Create property object from database data"""
        return {
            '_id': data.get('_id'),
            'account_id': data.get('account_id'),
            'client_id': data.get('client_id'),
            'owner_id': data.get('owner_id'),
            'property_name': data.get('property_name'),
            'property_type': data.get('property_type'),
            'property_status': data.get('property_status'),
            'address': data.get('address'),
            'city': data.get('city'),
            'state': data.get('state'),
            'zip_code': data.get('zip_code'),
            'country': data.get('country'),
            'latitude': data.get('latitude'),
            'longitude': data.get('longitude'),
            'total_area': data.get('total_area'),
            'area_unit': data.get('area_unit'),
            'built_area': data.get('built_area'),
            'carpet_area': data.get('carpet_area'),
            'land_area': data.get('land_area'),
            'number_of_units': data.get('number_of_units'),
            'bedrooms': data.get('bedrooms'),
            'bathrooms': data.get('bathrooms'),
            'parking_spaces': data.get('parking_spaces'),
            'construction_year': data.get('construction_year'),
            'property_age': data.get('property_age'),
            'facing': data.get('facing'),
            'furnishing': data.get('furnishing'),
            'amenities': data.get('amenities'),
            'landmark': data.get('landmark'),
            'survey_number': data.get('survey_number'),
            'property_id_number': data.get('property_id_number'),
            'purchase_price': data.get('purchase_price'),
            'estimated_value': data.get('estimated_value'),
            'rental_value': data.get('rental_value'),
            'currency': data.get('currency'),
            'documents': data.get('documents'),
            'photos': data.get('photos'),
            'notes': data.get('notes'),
            'status': data.get('status'),
            'created_by': data.get('created_by'),
            'created_at': data.get('created_at'),
            'updated_at': data.get('updated_at')
        }
