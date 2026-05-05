"""
Customer Service - Contains customer business logic
"""
from datetime import datetime
from bson.objectid import ObjectId


class CustomerService:
    """Service for customer operations"""
    
    def __init__(self, customer_repository):
        """
        Initialize customer service
        
        Args:
            customer_repository: CustomerRepository instance
        """
        self.customer_repository = customer_repository
    
    def create_customer(self, user_id, name, email, phone, company='', position='',
                       address='', city='', state='', zip_code='', country='',
                       website='', industry='', notes='', status='active'):
        """
        Create a new customer
        
        Args:
            user_id (str): User ID creating the customer
            name (str): Customer name
            email (str): Customer email
            phone (str): Customer phone
            company (str): Company name
            position (str): Job position
            address (str): Street address
            city (str): City
            state (str): State/Province
            zip_code (str): Postal code
            country (str): Country
            website (str): Website URL
            industry (str): Industry type
            notes (str): Additional notes
            status (str): Customer status
            
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            # Validation
            if not name or not email or not phone:
                return False, 'Name, email, and phone are required', None
            
            # Check if customer with this email already exists
            existing = self.customer_repository.find_by_email(email)
            if existing:
                return False, 'Customer with this email already exists', None
            
            # Prepare customer data
            customer_data = {
                'name': name.strip(),
                'email': email.strip().lower(),
                'phone': phone.strip(),
                'company': company.strip() if company else '',
                'position': position.strip() if position else '',
                'address': address.strip() if address else '',
                'city': city.strip() if city else '',
                'state': state.strip() if state else '',
                'zip_code': zip_code.strip() if zip_code else '',
                'country': country.strip() if country else '',
                'website': website.strip() if website else '',
                'industry': industry.strip() if industry else '',
                'notes': notes.strip() if notes else '',
                'status': status
            }
            
            # Create customer
            customer_id = self.customer_repository.create_customer(customer_data, user_id)
            
            # Fetch and return the created customer
            customer = self.customer_repository.find_by_id(customer_id)
            customer['_id'] = str(customer['_id'])
            customer['created_at'] = customer['created_at'].isoformat() if customer['created_at'] else None
            customer['updated_at'] = customer['updated_at'].isoformat() if customer['updated_at'] else None
            
            return True, 'Customer created successfully', customer
        
        except Exception as e:
            return False, f'Error creating customer: {str(e)}', None
    
    def get_customer(self, customer_id):
        """
        Get customer by ID
        
        Args:
            customer_id (str): Customer ID
            
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            customer = self.customer_repository.find_by_id(customer_id)
            
            if not customer:
                return False, 'Customer not found', None
            
            # Serialize for JSON
            customer['_id'] = str(customer['_id'])
            customer['created_at'] = customer['created_at'].isoformat() if customer['created_at'] else None
            customer['updated_at'] = customer['updated_at'].isoformat() if customer['updated_at'] else None
            
            return True, 'Customer retrieved successfully', customer
        
        except Exception as e:
            return False, f'Error retrieving customer: {str(e)}', None
    
    def update_customer(self, customer_id, **kwargs):
        """
        Update customer
        
        Args:
            customer_id (str): Customer ID
            **kwargs: Fields to update
            
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            # Verify customer exists
            customer = self.customer_repository.find_by_id(customer_id)
            if not customer:
                return False, 'Customer not found', None
            
            # Prepare update data (only update provided fields)
            update_data = {}
            allowed_fields = ['name', 'email', 'phone', 'company', 'position', 
                            'address', 'city', 'state', 'zip_code', 'country', 
                            'website', 'industry', 'notes', 'status']
            
            for field in allowed_fields:
                if field in kwargs and kwargs[field] is not None:
                    value = kwargs[field]
                    if isinstance(value, str):
                        update_data[field] = value.strip()
                    else:
                        update_data[field] = value
            
            if not update_data:
                return False, 'No valid fields to update', None
            
            # Update customer
            success = self.customer_repository.update_customer(customer_id, update_data)
            
            if success:
                # Fetch and return updated customer
                updated_customer = self.customer_repository.find_by_id(customer_id)
                updated_customer['_id'] = str(updated_customer['_id'])
                updated_customer['created_at'] = updated_customer['created_at'].isoformat() if updated_customer['created_at'] else None
                updated_customer['updated_at'] = updated_customer['updated_at'].isoformat() if updated_customer['updated_at'] else None
                
                return True, 'Customer updated successfully', updated_customer
            else:
                return False, 'Failed to update customer', None
        
        except Exception as e:
            return False, f'Error updating customer: {str(e)}', None
    
    def delete_customer(self, customer_id):
        """
        Delete customer
        
        Args:
            customer_id (str): Customer ID
            
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Verify customer exists
            customer = self.customer_repository.find_by_id(customer_id)
            if not customer:
                return False, 'Customer not found'
            
            # Delete customer
            success = self.customer_repository.delete_customer(customer_id)
            
            if success:
                return True, 'Customer deleted successfully'
            else:
                return False, 'Failed to delete customer'
        
        except Exception as e:
            return False, f'Error deleting customer: {str(e)}'
    
    def get_all_customers(self, user_id, skip=0, limit=100, status=None):
        """
        Get all customers for a user
        
        Args:
            user_id (str): User ID
            skip (int): Number of documents to skip
            limit (int): Number of documents to return
            status (str): Optional status filter
            
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            customers, total_count = self.customer_repository.get_all_customers(
                user_id=user_id,
                skip=skip,
                limit=limit,
                status=status
            )
            
            # Serialize for JSON
            serialized_customers = []
            for customer in customers:
                customer['_id'] = str(customer['_id'])
                customer['created_at'] = customer['created_at'].isoformat() if customer['created_at'] else None
                customer['updated_at'] = customer['updated_at'].isoformat() if customer['updated_at'] else None
                serialized_customers.append(customer)
            
            return True, 'Customers retrieved successfully', {
                'customers': serialized_customers,
                'total_count': total_count,
                'skip': skip,
                'limit': limit
            }
        
        except Exception as e:
            return False, f'Error retrieving customers: {str(e)}', None
    
    def search_customers(self, user_id, search_query):
        """
        Search customers
        
        Args:
            user_id (str): User ID
            search_query (str): Search term
            
        Returns:
            tuple: (success: bool, message: str, data: list or None)
        """
        try:
            if not search_query or len(search_query.strip()) < 2:
                return False, 'Search query must be at least 2 characters', None
            
            customers = self.customer_repository.search_customers(
                search_query=search_query,
                user_id=user_id
            )
            
            # Serialize for JSON
            serialized_customers = []
            for customer in customers:
                customer['_id'] = str(customer['_id'])
                customer['created_at'] = customer['created_at'].isoformat() if customer['created_at'] else None
                customer['updated_at'] = customer['updated_at'].isoformat() if customer['updated_at'] else None
                serialized_customers.append(customer)
            
            return True, f'Found {len(serialized_customers)} customers', serialized_customers
        
        except Exception as e:
            return False, f'Error searching customers: {str(e)}', None
    
    def get_customer_statistics(self, user_id):
        """
        Get customer statistics for a user
        
        Args:
            user_id (str): User ID
            
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            total = self.customer_repository.get_customer_count(user_id=user_id)
            active = len(self.customer_repository.get_customers_by_status('active', user_id=user_id))
            inactive = len(self.customer_repository.get_customers_by_status('inactive', user_id=user_id))
            prospect = len(self.customer_repository.get_customers_by_status('prospect', user_id=user_id))
            
            return True, 'Statistics retrieved successfully', {
                'total': total,
                'active': active,
                'inactive': inactive,
                'prospect': prospect
            }
        
        except Exception as e:
            return False, f'Error retrieving statistics: {str(e)}', None
