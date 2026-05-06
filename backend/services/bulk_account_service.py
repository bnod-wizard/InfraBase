"""
Bulk Account Creation Service - Handles creating account with related data
"""
from datetime import datetime
from models.account_model import AccountModel
from models.client_model import ClientModel
from models.property_model import PropertyModel
from models.owner_model import OwnerModel
from bson import ObjectId


class BulkAccountCreationService:
    """Service for bulk creating account with clients, properties, and owners"""

    def __init__(self, account_repository, client_repository, property_repository, owner_repository):
        self.account_repository = account_repository
        self.client_repository = client_repository
        self.property_repository = property_repository
        self.owner_repository = owner_repository

    def create_account_with_hierarchy(self, payload, created_by):
        """
        Create account with all related clients, properties, and owners
        
        Payload structure:
        {
            "account": { account fields },
            "clients": [{ client fields }, ...],
            "properties": [{ property fields }, ...],
            "owners": [{ owner fields }, ...]
        }
        """
        try:
            # Validate payload
            if not payload.get('account'):
                return False, "Account data is required", None
            
            account_data = payload['account']
            clients_data = payload.get('clients', [])
            properties_data = payload.get('properties', [])
            owners_data = payload.get('owners', [])

            # Step 1: Create Account
            if not account_data.get('account_name'):
                return False, "Account name is required", None
            if not account_data.get('email'):
                return False, "Account email is required", None

            # Check duplicate email
            existing = self.account_repository.get_by_email(account_data.get('email'))
            if existing:
                return False, "Account with this email already exists", None

            # Prepare and create account
            account_dict = AccountModel.to_dict(account_data)
            account_dict['created_by'] = created_by
            account_id = self.account_repository.create_account(account_dict)
            account_dict['_id'] = account_id

            response_data = {
                'account': AccountModel.to_json(account_dict),
                'clients': [],
                'properties': [],
                'owners': []
            }

            # Step 2: Create Clients
            for client_data in clients_data:
                try:
                    client_data['account_id'] = account_id
                    if not client_data.get('first_name') or not client_data.get('email'):
                        continue
                    
                    client_dict = ClientModel.to_dict(client_data)
                    client_dict['created_by'] = created_by
                    client_id = self.client_repository.create_client(client_dict)
                    client_dict['_id'] = client_id
                    response_data['clients'].append(ClientModel.to_json(client_dict))
                except Exception as e:
                    print(f"Error creating client: {str(e)}")
                    continue

            # Step 3: Create Properties
            property_id_mapping = {}  # Map temporary IDs to actual DB IDs
            for prop_data in properties_data:
                try:
                    temp_id = prop_data.get('id')
                    prop_data['account_id'] = account_id
                    
                    if not prop_data.get('property_name') or not prop_data.get('address'):
                        continue
                    
                    property_dict = PropertyModel.to_dict(prop_data)
                    property_dict['created_by'] = created_by
                    prop_id = self.property_repository.create_property(property_dict)
                    property_dict['_id'] = prop_id
                    
                    # Store mapping for owners
                    if temp_id:
                        property_id_mapping[temp_id] = prop_id
                    
                    response_data['properties'].append(PropertyModel.to_json(property_dict))
                except Exception as e:
                    print(f"Error creating property: {str(e)}")
                    continue

            # Step 4: Create Owners
            for owner_data in owners_data:
                try:
                    owner_data['account_id'] = account_id
                    
                    # Map temporary property ID to actual DB ID
                    temp_prop_id = owner_data.get('property_id')
                    if temp_prop_id and temp_prop_id in property_id_mapping:
                        owner_data['owner_id'] = property_id_mapping[temp_prop_id]
                    
                    if not owner_data.get('owner_name') or not owner_data.get('email'):
                        continue
                    
                    owner_dict = OwnerModel.to_dict(owner_data)
                    owner_dict['created_by'] = created_by
                    owner_id = self.owner_repository.create_owner(owner_dict)
                    owner_dict['_id'] = owner_id
                    response_data['owners'].append(OwnerModel.to_json(owner_dict))
                except Exception as e:
                    print(f"Error creating owner: {str(e)}")
                    continue

            return True, "Account and related data created successfully", response_data

        except Exception as e:
            return False, f"Error creating account hierarchy: {str(e)}", None

    def get_account_hierarchy(self, account_id):
        """Get complete account with all related data"""
        try:
            # Get account
            account = self.account_repository.find_by_id(account_id)
            if not account:
                return False, "Account not found", None

            # Get clients
            clients = self.client_repository.find_by_account(account_id, 0, 1000)
            
            # Get properties
            properties = self.property_repository.find_by_account(account_id, 0, 1000)
            
            # Get owners
            owners = self.owner_repository.find_by_account(account_id, 0, 1000)

            response_data = {
                'account': AccountModel.to_json(account),
                'clients': [ClientModel.to_json(c) for c in clients],
                'properties': [PropertyModel.to_json(p) for p in properties],
                'owners': [OwnerModel.to_json(o) for o in owners]
            }

            return True, "Account hierarchy retrieved successfully", response_data
        except Exception as e:
            return False, f"Error retrieving account hierarchy: {str(e)}", None
