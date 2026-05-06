"""
Property Service - Business logic for Property operations
"""
from datetime import datetime
from models.property_model import PropertyModel
from bson import ObjectId


class PropertyService:
    """Service for Property business logic"""

    def __init__(self, property_repository):
        self.property_repository = property_repository

    def create_property(self, property_data, created_by):
        """Create a new property with validation"""
        try:
            # Validate required fields
            if not property_data.get('property_name'):
                return False, "Property name is required", None
            
            if not property_data.get('account_id'):
                return False, "Account ID is required", None

            if not property_data.get('address'):
                return False, "Address is required", None

            # Prepare property data
            property_dict = PropertyModel.to_dict(property_data)
            property_dict['created_by'] = created_by

            # Create property
            property_id = self.property_repository.create_property(property_dict)
            property_dict['_id'] = property_id
            
            return True, "Property created successfully", PropertyModel.to_json(property_dict)
        except Exception as e:
            return False, str(e), None

    def get_property(self, property_id):
        """Get property by ID"""
        try:
            property_obj = self.property_repository.find_by_id(property_id)
            if not property_obj:
                return False, "Property not found", None
            return True, "Property retrieved successfully", PropertyModel.to_json(property_obj)
        except Exception as e:
            return False, str(e), None

    def get_properties_by_account(self, account_id, skip=0, limit=10):
        """Get all properties for an account"""
        try:
            properties = self.property_repository.find_by_account(account_id, skip, limit)
            total = self.property_repository.get_total_count_by_account(account_id)
            properties_json = [PropertyModel.to_json(p) for p in properties]
            return True, "Properties retrieved successfully", {
                'data': properties_json,
                'total': total,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def get_properties_by_client(self, client_id, skip=0, limit=10):
        """Get all properties for a client"""
        try:
            properties = self.property_repository.find_by_client(client_id, skip, limit)
            properties_json = [PropertyModel.to_json(p) for p in properties]
            return True, "Properties retrieved successfully", {
                'data': properties_json,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def get_all_properties(self, skip=0, limit=10):
        """Get all properties with pagination"""
        try:
            properties = self.property_repository.find_all(skip, limit)
            properties_json = [PropertyModel.to_json(p) for p in properties]
            return True, "Properties retrieved successfully", {
                'data': properties_json,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def update_property(self, property_id, property_data):
        """Update property"""
        try:
            # Get existing property
            property_obj = self.property_repository.find_by_id(property_id)
            if not property_obj:
                return False, "Property not found", None

            # Update property data
            updated_data = PropertyModel.to_dict(property_data)
            updated_data['_id'] = property_obj['_id']
            
            success = self.property_repository.update_property(property_id, updated_data)
            if success:
                updated_property = self.property_repository.find_by_id(property_id)
                return True, "Property updated successfully", PropertyModel.to_json(updated_property)
            else:
                return False, "Failed to update property", None
        except Exception as e:
            return False, str(e), None

    def delete_property(self, property_id):
        """Delete property"""
        try:
            property_obj = self.property_repository.find_by_id(property_id)
            if not property_obj:
                return False, "Property not found", None

            success = self.property_repository.delete_property(property_id)
            if success:
                return True, "Property deleted successfully", None
            else:
                return False, "Failed to delete property", None
        except Exception as e:
            return False, str(e), None

    def search_properties(self, query, account_id=None, skip=0, limit=10):
        """Search properties"""
        try:
            if len(query) < 2:
                return False, "Search query must be at least 2 characters", None
            
            properties = self.property_repository.search_properties(query, account_id, skip, limit)
            properties_json = [PropertyModel.to_json(p) for p in properties]
            return True, "Search completed", {
                'data': properties_json,
                'query': query,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def find_by_type(self, property_type, account_id=None, skip=0, limit=10):
        """Find properties by type"""
        try:
            properties = self.property_repository.find_by_type(property_type, account_id, skip, limit)
            properties_json = [PropertyModel.to_json(p) for p in properties]
            return True, "Properties retrieved successfully", {
                'data': properties_json,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def find_by_status(self, status, account_id=None, skip=0, limit=10):
        """Find properties by status"""
        try:
            properties = self.property_repository.find_by_status(status, account_id, skip, limit)
            properties_json = [PropertyModel.to_json(p) for p in properties]
            return True, "Properties retrieved successfully", {
                'data': properties_json,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def create_bulk_properties(self, properties_data, account_id, created_by):
        """Create multiple properties at once"""
        try:
            created_properties = []
            for prop_data in properties_data:
                prop_data['account_id'] = ObjectId(account_id)
                property_dict = PropertyModel.to_dict(prop_data)
                property_dict['created_by'] = created_by
                
                prop_id = self.property_repository.create_property(property_dict)
                property_dict['_id'] = prop_id
                created_properties.append(PropertyModel.to_json(property_dict))
            
            return True, f"{len(created_properties)} properties created successfully", created_properties
        except Exception as e:
            return False, str(e), None
