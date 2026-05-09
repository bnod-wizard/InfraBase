"""
Account Service - Business logic for Account operations
"""
from datetime import datetime
from models.account_model import AccountModel


class AccountService:
    """Service for Account business logic"""

    def __init__(self, account_repository):
        self.account_repository = account_repository

    def create_account(self, account_data, created_by):
        """Create a new account with validation"""
        try:
            # Validate required fields
            if not account_data.get('account_name'):
                return False, "Account name is required", None
            
            if not account_data.get('email'):
                return False, "Email is required", None

            # Check if account with same email already exists
            existing = self.account_repository.get_by_email(account_data.get('email'))
            if existing:
                return False, "Account with this email already exists", None

            # Prepare account data
            account_dict = AccountModel.to_dict(account_data)
            account_dict['created_by'] = created_by

            # Create account
            account_id = self.account_repository.create_account(account_dict)
            account_dict['_id'] = account_id
            
            return True, "Account created successfully", AccountModel.to_json(account_dict)
        except Exception as e:
            return False, str(e), None

    def get_account(self, account_id):
        """Get account by ID"""
        try:
            account = self.account_repository.find_by_id(account_id)
            if not account:
                return False, "Account not found", None
            return True, "Account retrieved successfully", AccountModel.to_json(account)
        except Exception as e:
            return False, str(e), None

    def get_all_accounts(self, skip=0, limit=10):
        """Get all accounts with pagination"""
        try:
            accounts = self.account_repository.find_all(skip, limit)
            total = self.account_repository.get_total_count()
            accounts_json = [AccountModel.to_json(acc) for acc in accounts]
            return True, "Accounts retrieved successfully", {
                'data': accounts_json,
                'total': total,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def update_account(self, account_id, account_data):
        """Update account"""
        try:
            # Get existing account
            account = self.account_repository.find_by_id(account_id)
            if not account:
                return False, "Account not found", None

            # Update account data
            updated_data = AccountModel.to_dict(account_data)
            updated_data['_id'] = account['_id']
            
            success = self.account_repository.update_account(account_id, updated_data)
            if success:
                updated_account = self.account_repository.find_by_id(account_id)
                return True, "Account updated successfully", AccountModel.to_json(updated_account)
            else:
                return False, "Failed to update account", None
        except Exception as e:
            return False, str(e), None

    def delete_account(self, account_id):
        """Delete account"""
        try:
            account = self.account_repository.find_by_id(account_id)
            if not account:
                return False, "Account not found", None

            success = self.account_repository.delete_account(account_id)
            if success:
                return True, "Account deleted successfully", None
            else:
                return False, "Failed to delete account", None
        except Exception as e:
            return False, str(e), None

    def search_accounts(self, query, skip=0, limit=10):
        """Search accounts"""
        try:
            if len(query) < 2:
                return False, "Search query must be at least 2 characters", None
            
            accounts = self.account_repository.search_accounts(query, skip, limit)
            accounts_json = [AccountModel.to_json(acc) for acc in accounts]
            return True, "Search completed", {
                'data': accounts_json,
                'query': query,
                'skip': skip,
                'limit': limit
            }
        except Exception as e:
            return False, str(e), None

    def get_account_statistics(self):
        """Get account statistics"""
        try:
            total = self.account_repository.get_total_count()
            status_counts = self.account_repository.get_status_counts()
            return True, "Statistics retrieved", {
                'total_accounts': total,
                'status_counts': status_counts
            }
        except Exception as e:
            return False, str(e), None
