"""
PDF Controller - Handles PDF generation endpoints
"""
from flask import request, send_file, jsonify
from functools import wraps
from io import BytesIO

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

class PDFController:
    """Controller for PDF generation endpoints"""
    
    def __init__(self, pdf_service, customer_service, auth_service):
        """
        Initialize PDF controller
        
        Args:
            pdf_service: PDFService instance
            customer_service: CustomerService instance
            auth_service: AuthService instance for token verification
        """
        self.pdf_service = pdf_service
        self.customer_service = customer_service
        self.auth_service = auth_service
    
    @token_required
    def generate_letterhead_pdf(self, customer_id):
        """
        Generate letterhead PDF for a customer
        
        Route: GET /api/customers/<customer_id>/pdf/letterhead
        Headers: Authorization: Bearer <token>
        
        Returns:
            PDF file download or error message
        """
        try:
            # Get customer
            success, message, customer = self.customer_service.get_customer(customer_id)
            
            if not success:
                return jsonify({'message': 'Customer not found'}), 404
            
            # Generate PDF
            pdf_content = self.pdf_service.generate_letterhead_pdf(customer)
            
            if pdf_content is None:
                return jsonify({'message': 'Failed to generate PDF'}), 500
            
            # Create BytesIO object
            pdf_buffer = BytesIO(pdf_content)
            
            # Return PDF file
            filename = f"letterhead_{customer.get('name', 'customer').replace(' ', '_')}.pdf"
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=filename
            )
        
        except Exception as e:
            return jsonify({'message': f'Error generating PDF: {str(e)}'}), 500
    
    @token_required
    def generate_cover_pdf(self, customer_id):
        """
        Generate cover page PDF for a customer
        
        Route: GET /api/customers/<customer_id>/pdf/cover
        Headers: Authorization: Bearer <token>
        
        Returns:
            PDF file download or error message
        """
        try:
            # Get customer
            success, message, customer = self.customer_service.get_customer(customer_id)
            
            if not success:
                return jsonify({'message': 'Customer not found'}), 404
            
            # Generate PDF
            pdf_content = self.pdf_service.generate_cover_pdf(customer)
            
            if pdf_content is None:
                return jsonify({'message': 'Failed to generate PDF'}), 500
            
            # Create BytesIO object
            pdf_buffer = BytesIO(pdf_content)
            
            # Return PDF file
            filename = f"cover_{customer.get('name', 'customer').replace(' ', '_')}.pdf"
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=filename
            )
        
        except Exception as e:
            return jsonify({'message': f'Error generating PDF: {str(e)}'}), 500
    
    @token_required
    def generate_report_pdf(self, customer_id):
        """
        Generate customer report PDF
        
        Route: GET /api/customers/<customer_id>/pdf/report
        Headers: Authorization: Bearer <token>
        
        Returns:
            PDF file download or error message
        """
        try:
            # Get customer
            success, message, customer = self.customer_service.get_customer(customer_id)
            
            if not success:
                return jsonify({'message': 'Customer not found'}), 404
            
            # Generate PDF
            pdf_content = self.pdf_service.generate_customer_report_pdf(customer)
            
            if pdf_content is None:
                return jsonify({'message': 'Failed to generate PDF'}), 500
            
            # Create BytesIO object
            pdf_buffer = BytesIO(pdf_content)
            
            # Return PDF file
            filename = f"report_{customer.get('name', 'customer').replace(' ', '_')}.pdf"
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=filename
            )
        
        except Exception as e:
            return jsonify({'message': f'Error generating PDF: {str(e)}'}), 500
