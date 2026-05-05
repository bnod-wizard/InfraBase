"""
Customer Controller - Handles customer API endpoints
"""
from flask import request, jsonify
from functools import wraps

def token_required(f):
    """
    Decorator to verify JWT token
    
    Args:
        f: Function to decorate
        
    Returns:
        Decorated function
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            token = token.split(' ')[1]  # Bearer <token>
            controller = args[0]  # self
            payload = controller.auth_service.verify_token(token)
            request.user_id = payload['user_id']
        except IndexError:
            return jsonify({'message': 'Invalid authorization header'}), 401
        except Exception as e:
            return jsonify({'message': str(e)}), 401
        
        return f(*args, **kwargs)
    return decorated

class CustomerController:
    """Controller for customer endpoints"""
    
    def __init__(self, customer_service, auth_service):
        """
        Initialize customer controller
        
        Args:
            customer_service: CustomerService instance
            auth_service: AuthService instance for token verification
        """
        self.customer_service = customer_service
        self.auth_service = auth_service
    
    @token_required
    def create_customer(self):
        """
        Create a new customer
        
        Route: POST /api/customers
        Headers: Authorization: Bearer <token>
        Body: {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+1-555-1234",
            "company": "ABC Corp",
            "position": "Manager",
            "address": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zip_code": "10001",
            "country": "USA",
            "website": "https://example.com",
            "industry": "Technology",
            "notes": "Important customer",
            "status": "active"
        }
        
        Returns:
            Response with created customer data or error message
        """
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'Request body is required'}), 400
        
        success, message, result = self.customer_service.create_customer(
            user_id=request.user_id,
            name=data.get('name'),
            email=data.get('email'),
            phone=data.get('phone'),
            company=data.get('company', ''),
            position=data.get('position', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            zip_code=data.get('zip_code', ''),
            country=data.get('country', ''),
            website=data.get('website', ''),
            industry=data.get('industry', ''),
            notes=data.get('notes', ''),
            status=data.get('status', 'active')
        )
        
        if success:
            return jsonify({
                'message': message,
                'data': result
            }), 201
        else:
            return jsonify({'message': message}), 400
    
    @token_required
    def get_customer(self, customer_id):
        """
        Get a single customer by ID
        
        Route: GET /api/customers/<customer_id>
        Headers: Authorization: Bearer <token>
        
        Returns:
            Response with customer data or error message
        """
        success, message, result = self.customer_service.get_customer(customer_id)
        
        if success:
            return jsonify({
                'message': message,
                'data': result
            }), 200
        else:
            return jsonify({'message': message}), 404
    
    @token_required
    def get_all_customers(self):
        """
        Get all customers for authenticated user
        
        Route: GET /api/customers?skip=0&limit=100&status=active
        Headers: Authorization: Bearer <token>
        Query Parameters:
            skip: Number of documents to skip (default: 0)
            limit: Number of documents to return (default: 100)
            status: Filter by status - active/inactive/prospect (optional)
        
        Returns:
            Response with customers list and total count
        """
        skip = int(request.args.get('skip', 0))
        limit = int(request.args.get('limit', 100))
        status = request.args.get('status')
        
        # Validate pagination
        if skip < 0 or limit < 1 or limit > 500:
            return jsonify({'message': 'Invalid pagination parameters'}), 400
        
        success, message, result = self.customer_service.get_all_customers(
            user_id=request.user_id,
            skip=skip,
            limit=limit,
            status=status
        )
        
        if success:
            return jsonify({
                'message': message,
                'data': result
            }), 200
        else:
            return jsonify({'message': message}), 500
    
    @token_required
    def update_customer(self, customer_id):
        """
        Update a customer
        
        Route: PUT /api/customers/<customer_id>
        Headers: Authorization: Bearer <token>
        Body: {
            "name": "Updated Name",
            "email": "updated@example.com",
            ...other fields...
        }
        
        Returns:
            Response with updated customer data or error message
        """
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'Request body is required'}), 400
        
        success, message, result = self.customer_service.update_customer(
            customer_id=customer_id,
            **data
        )
        
        if success:
            return jsonify({
                'message': message,
                'data': result
            }), 200
        else:
            return jsonify({'message': message}), 400 if 'not found' in message.lower() else 500
    
    @token_required
    def delete_customer(self, customer_id):
        """
        Delete a customer
        
        Route: DELETE /api/customers/<customer_id>
        Headers: Authorization: Bearer <token>
        
        Returns:
            Response confirming deletion or error message
        """
        success, message = self.customer_service.delete_customer(customer_id)
        
        if success:
            return jsonify({'message': message}), 200
        else:
            return jsonify({'message': message}), 400 if 'not found' in message.lower() else 500
    
    @token_required
    def search_customers(self):
        """
        Search customers
        
        Route: GET /api/customers/search?q=john
        Headers: Authorization: Bearer <token>
        Query Parameters:
            q: Search query (minimum 2 characters)
        
        Returns:
            Response with matching customers
        """
        search_query = request.args.get('q', '').strip()
        
        if not search_query:
            return jsonify({'message': 'Search query parameter "q" is required'}), 400
        
        success, message, result = self.customer_service.search_customers(
            user_id=request.user_id,
            search_query=search_query
        )
        
        if success:
            return jsonify({
                'message': message,
                'data': result
            }), 200
        else:
            return jsonify({'message': message}), 400
    
    @token_required
    def get_statistics(self):
        """
        Get customer statistics
        
        Route: GET /api/customers/statistics
        Headers: Authorization: Bearer <token>
        
        Returns:
            Response with customer statistics
        """
        success, message, result = self.customer_service.get_customer_statistics(
            user_id=request.user_id
        )
        
        if success:
            return jsonify({
                'message': message,
                'data': result
            }), 200
        else:
            return jsonify({'message': message}), 500
