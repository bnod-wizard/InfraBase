"""
Account Service - Business logic for Account operations
"""
from datetime import datetime
from models.account_model import AccountModel


class AccountService:
    """Service for Account business logic"""

    def __init__(self, account_repository):
        self.account_repository = account_repository

    def create_account(self, account_data, created_by, created_by_name=None):
        """Create a new account with validation"""
        try:
            if not account_data.get('account_name'):
                return False, "Account name is required", None

            if not account_data.get('email'):
                return False, "Email is required", None

            existing = self.account_repository.get_by_email(account_data.get('email'))
            if existing:
                return False, "Account with this email already exists", None

            account_dict = AccountModel.to_dict(account_data)
            account_dict['created_by'] = created_by
            if created_by_name:
                account_dict['created_by_name'] = created_by_name

            account_id = self.account_repository.create_account(account_dict, changed_by_name=created_by_name)
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

    def update_account(self, account_id, account_data, changed_by=None, changed_by_name=None):
        """Update account"""
        try:
            account = self.account_repository.find_by_id(account_id)
            if not account:
                return False, "Account not found", None

            updated_data = AccountModel.to_dict(account_data)
            updated_data['_id'] = account['_id']

            success = self.account_repository.update_account(
                account_id, updated_data,
                changed_by=changed_by, changed_by_name=changed_by_name
            )
            if success:
                updated_account = self.account_repository.find_by_id(account_id)
                return True, "Account updated successfully", AccountModel.to_json(updated_account)
            return False, "Failed to update account", None
        except Exception as e:
            return False, str(e), None

    def delete_account(self, account_id, changed_by=None, changed_by_name=None):
        """Soft-delete account"""
        try:
            account = self.account_repository.find_by_id(account_id)
            if not account:
                return False, "Account not found", None

            success = self.account_repository.delete_account(
                account_id, changed_by=changed_by, changed_by_name=changed_by_name
            )
            if success:
                return True, "Account deleted successfully", None
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

    def get_accounts_with_filters(self, query='', status_filters=None, skip=0, limit=10):
        """Get accounts with combined search and status filters"""
        try:
            accounts, total = self.account_repository.get_accounts_with_filters(
                query, status_filters, skip, limit
            )
            accounts_json = [AccountModel.to_json(acc) for acc in accounts]
            return True, "Accounts retrieved successfully", {
                'data': accounts_json,
                'total': total,
                'skip': skip,
                'limit': limit,
                'query': query,
                'filters': status_filters or []
            }
        except Exception as e:
            return False, str(e), None

    def get_stats_overview(self):
        """Get account counts grouped for dashboard KPIs"""
        try:
            total = self.account_repository.get_total_count()
            raw_counts = self.account_repository.get_status_counts()

            # Map any casing variant to the canonical Title Case label
            _canonical = {
                'active': 'Active', 'prospect': 'Prospect',
                'bank verification': 'Bank Verification',
                'bank verified': 'Bank Verified',
                'payment pending': 'Payment Pending',
                'paid': 'Paid', 'lost': 'Lost',
                'archived': 'Archived', 'deleted': 'Deleted',
                'inactive': 'Inactive',
            }
            status_counts = {}
            for k, v in raw_counts.items():
                if k:
                    label = _canonical.get(k.lower(), k)
                    status_counts[label] = status_counts.get(label, 0) + v

            active     = status_counts.get('Active', 0)
            lost       = (status_counts.get('Lost', 0)
                          + status_counts.get('Deleted', 0)
                          + status_counts.get('Archived', 0))
            in_process = max(total - active - lost, 0)

            return True, "Stats retrieved", {
                'total_accounts': total,
                'status_counts': status_counts,
                'active': active,
                'in_process': in_process,
                'lost': lost,
            }
        except Exception as e:
            return False, str(e), None

    def get_monthly_counts(self):
        """Get account creation counts for the last 6 months"""
        try:
            from datetime import timezone
            now = datetime.now(timezone.utc)

            months_list = []
            for i in range(5, -1, -1):
                year  = now.year
                month = now.month - i
                while month <= 0:
                    month += 12
                    year  -= 1
                months_list.append({'year': year, 'month': month})

            start = datetime(months_list[0]['year'], months_list[0]['month'], 1,
                             tzinfo=timezone.utc)
            raw       = self.account_repository.get_monthly_counts(start)
            count_map = {(r['_id']['year'], r['_id']['month']): r['count'] for r in raw}

            names  = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec']
            result = [
                {
                    'label': names[m['month'] - 1],
                    'year':  m['year'],
                    'month': m['month'],
                    'count': count_map.get((m['year'], m['month']), 0),
                }
                for m in months_list
            ]
            return True, "Monthly counts retrieved", result
        except Exception as e:
            return False, str(e), None

    def get_account_changelog(self, account_id, limit=50):
        """Get account changelog"""
        try:
            logs = self.account_repository.get_changelog(account_id, limit)
            return True, "Changelog retrieved", self._serialize_logs(logs)
        except Exception as e:
            return False, str(e), None

    def get_recent_changelogs(self, limit=20):
        """Get most recent changelog entries across all accounts"""
        try:
            logs = self.account_repository.get_recent_changelogs(limit)
            return True, "Recent changelogs retrieved", self._serialize_logs(logs)
        except Exception as e:
            return False, str(e), None

    @staticmethod
    def _serialize_logs(logs):
        result = []
        for log in logs:
            entry = dict(log)
            if '_id' in entry:
                entry['_id'] = str(entry['_id'])
            if 'changed_at' in entry and hasattr(entry['changed_at'], 'isoformat'):
                entry['changed_at'] = entry['changed_at'].isoformat()
            result.append(entry)
        return result
