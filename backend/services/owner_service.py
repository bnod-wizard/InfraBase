"""
Owner Service - Business logic for Owner operations
"""
from datetime import datetime
from models.owner_model import OwnerModel
from bson import ObjectId


class OwnerService:
    """Service for Owner business logic"""

    def __init__(self, owner_repository):
        self.owner_repository = owner_repository

    def create_owner(self, owner_data, created_by):
        """Create a new owner with validation"""
        try:
            # Validate required fields
            if not owner_data.get('owner_name'):
                return False, "Owner name is required", None
            
            if not owner_data.get('account_id'):
                return False, "Account ID is required", None

            if not owner_data.get('email'):
                return False, "Email is required", None

            # Prepare owner data
            owner_dict = OwnerModel.to_dict(owner_data)
            owner_dict['created_by'] = created_by

            # Create owner
            owner_id = self.owner_repository.create_owner(owner_dict)
            owner_dict['_id'] = owner_id
            
            return True, "Owner created successfully", OwnerModel.to_json(owner_dict)
        except Exception as e:
            return False, str(e), None

    def get_owner(self, owner_id):
        """Get owner by ID"""
        try:
            owner = self.owner_repository.find_by_id(owner_id)
            if not owner:
                return False, "Owner not found", None
            return True, "Owner retrieved successfully", OwnerModel.to_json(owner)
        except Exception as e:
            return False, str(e), None

    def get_owners_by_account(self, account_id, skip=0, limit=10):
        """Get all owners for an account"""
        try:
            owners = self.owner_repository.find_by_account(account_id, skip, limit)
            total = self.owner_repository.get_total_count_by_property(account_id)
            owners_json = [OwnerModel.to_json(o) for o in owners]
            return True, "Owners retrieved successfully", {
                'data': owners_json,
                'total': total,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def get_owners_by_property(self, property_id, skip=0, limit=10):
        """Get all owners for a property"""
        try:
            owners = self.owner_repository.find_by_property(property_id, skip, limit)
            owners_json = [OwnerModel.to_json(o) for o in owners]
            return True, "Owners retrieved successfully", {
                'data': owners_json,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def get_all_owners(self, skip=0, limit=10):
        """Get all owners with pagination"""
        try:
            owners = self.owner_repository.find_all(skip, limit)
            owners_json = [OwnerModel.to_json(o) for o in owners]
            return True, "Owners retrieved successfully", {
                'data': owners_json,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def update_owner(self, owner_id, owner_data):
        """Update owner"""
        try:
            # Get existing owner
            owner = self.owner_repository.find_by_id(owner_id)
            if not owner:
                return False, "Owner not found", None

            # Update owner data
            updated_data = OwnerModel.to_dict(owner_data)
            updated_data['_id'] = owner['_id']
            
            success = self.owner_repository.update_owner(owner_id, updated_data)
            if success:
                updated_owner = self.owner_repository.find_by_id(owner_id)
                return True, "Owner updated successfully", OwnerModel.to_json(updated_owner)
            else:
                return False, "Failed to update owner", None
        except Exception as e:
            return False, str(e), None

    def delete_owner(self, owner_id):
        """Delete owner"""
        try:
            owner = self.owner_repository.find_by_id(owner_id)
            if not owner:
                return False, "Owner not found", None

            success = self.owner_repository.delete_owner(owner_id)
            if success:
                return True, "Owner deleted successfully", None
            else:
                return False, "Failed to delete owner", None
        except Exception as e:
            return False, str(e), None

    def search_owners(self, query, account_id=None, skip=0, limit=10):
        """Search owners"""
        try:
            if len(query) < 2:
                return False, "Search query must be at least 2 characters", None
            
            owners = self.owner_repository.search_owners(query, account_id, skip, limit)
            owners_json = [OwnerModel.to_json(o) for o in owners]
            return True, "Search completed", {
                'data': owners_json,
                'query': query,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def create_bulk_owners(self, owners_data, account_id, created_by):
        """Create multiple owners at once"""
        try:
            created_owners = []
            for owner_data in owners_data:
                owner_data['account_id'] = ObjectId(account_id)
                owner_dict = OwnerModel.to_dict(owner_data)
                owner_dict['created_by'] = created_by
                
                owner_id = self.owner_repository.create_owner(owner_dict)
                owner_dict['_id'] = owner_id
                created_owners.append(OwnerModel.to_json(owner_dict))
            
            return True, f"{len(created_owners)} owners created successfully", created_owners
        except Exception as e:
            return False, str(e), None
