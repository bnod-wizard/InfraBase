"""
Client Service - Business logic for Client operations
"""
from datetime import datetime
from models.client_model import ClientModel
from bson import ObjectId


class ClientService:
    """Service for Client business logic"""

    def __init__(self, client_repository):
        self.client_repository = client_repository

    def create_client(self, client_data, created_by):
        """Create a new client with validation"""
        try:
            # Validate required fields
            if not client_data.get('first_name'):
                return False, "First name is required", None
            
            if not client_data.get('account_id'):
                return False, "Account ID is required", None

            if not client_data.get('email'):
                return False, "Email is required", None

            # Prepare client data
            client_dict = ClientModel.to_dict(client_data)
            client_dict['created_by'] = created_by

            # Create client
            client_id = self.client_repository.create_client(client_dict)
            client_dict['_id'] = client_id
            
            return True, "Client created successfully", ClientModel.to_json(client_dict)
        except Exception as e:
            return False, str(e), None

    def get_client(self, client_id):
        """Get client by ID"""
        try:
            client = self.client_repository.find_by_id(client_id)
            if not client:
                return False, "Client not found", None
            return True, "Client retrieved successfully", ClientModel.to_json(client)
        except Exception as e:
            return False, str(e), None

    def get_clients_by_account(self, account_id, skip=0, limit=10):
        """Get all clients for an account"""
        try:
            clients = self.client_repository.find_by_account(account_id, skip, limit)
            total = self.client_repository.get_total_count_by_account(account_id)
            clients_json = [ClientModel.to_json(c) for c in clients]
            return True, "Clients retrieved successfully", {
                'data': clients_json,
                'total': total,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def get_all_clients(self, skip=0, limit=10):
        """Get all clients with pagination"""
        try:
            clients = self.client_repository.find_all(skip, limit)
            clients_json = [ClientModel.to_json(c) for c in clients]
            return True, "Clients retrieved successfully", {
                'data': clients_json,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def update_client(self, client_id, client_data):
        """Update client"""
        try:
            # Get existing client
            client = self.client_repository.find_by_id(client_id)
            if not client:
                return False, "Client not found", None

            # Update client data
            updated_data = ClientModel.to_dict(client_data)
            updated_data['_id'] = client['_id']
            
            success = self.client_repository.update_client(client_id, updated_data)
            if success:
                updated_client = self.client_repository.find_by_id(client_id)
                return True, "Client updated successfully", ClientModel.to_json(updated_client)
            else:
                return False, "Failed to update client", None
        except Exception as e:
            return False, str(e), None

    def delete_client(self, client_id):
        """Delete client"""
        try:
            client = self.client_repository.find_by_id(client_id)
            if not client:
                return False, "Client not found", None

            success = self.client_repository.delete_client(client_id)
            if success:
                return True, "Client deleted successfully", None
            else:
                return False, "Failed to delete client", None
        except Exception as e:
            return False, str(e), None

    def search_clients(self, query, account_id=None, skip=0, limit=10):
        """Search clients"""
        try:
            if len(query) < 2:
                return False, "Search query must be at least 2 characters", None
            
            clients = self.client_repository.search_clients(query, account_id, skip, limit)
            clients_json = [ClientModel.to_json(c) for c in clients]
            return True, "Search completed", {
                'data': clients_json,
                'query': query,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def create_bulk_clients(self, clients_data, account_id, created_by):
        """Create multiple clients at once"""
        try:
            created_clients = []
            for client_data in clients_data:
                client_data['account_id'] = ObjectId(account_id)
                client_dict = ClientModel.to_dict(client_data)
                client_dict['created_by'] = created_by
                
                client_id = self.client_repository.create_client(client_dict)
                client_dict['_id'] = client_id
                created_clients.append(ClientModel.to_json(client_dict))
            
            return True, f"{len(created_clients)} clients created successfully", created_clients
        except Exception as e:
            return False, str(e), None
