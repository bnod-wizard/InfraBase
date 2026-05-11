"""
InfraBase Backend - Main Application File
Organized with Controller, Service, Repository, and Model architecture
"""
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Import layers
from controllers import AuthController, CustomerController, PDFController
from controllers.account_controller import account_controller
from controllers.template_controller import template_controller
from controllers.settings_controller import settings_controller
from services import AuthService, CustomerService, PDFService
from services.account_service import AccountService
from services.client_service import ClientService
from services.owner_service import OwnerService
from services.property_service import PropertyService
from services.bulk_account_service import BulkAccountCreationService
from services.document_service import DocumentService
from services.template_service import TemplateService
from repositories import UserRepository, CustomerRepository
from repositories.account_repository import AccountRepository
from repositories.client_repository import ClientRepository
from repositories.owner_repository import OwnerRepository
from repositories.property_repository import PropertyRepository
from repositories.valuation_repository import ValuationRepository
from repositories.template_repository import TemplateRepository

load_dotenv()

app = Flask(__name__)
CORS(app, 
     resources={r"/api/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'dev-secret-key')
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/infrabase')

# MongoDB Connection
db = None
auth_controller = None
customer_controller = None
pdf_controller = None

try:
    client = MongoClient(MONGO_URI)
    db = client['infrabase']
    print("✓ Connected to MongoDB")
except Exception as e:
    print(f"✗ MongoDB connection error: {e}")

# Initialize services, repositories, and controllers
if db is not None:
    try:
        # Repository Layer
        user_repository = UserRepository(db)
        customer_repository = CustomerRepository(db)
        account_repository = AccountRepository(db)
        client_repository = ClientRepository(db)
        owner_repository = OwnerRepository(db)
        property_repository = PropertyRepository(db)
        valuation_repository = ValuationRepository(db)
        template_repository = TemplateRepository(db)

        # Service Layer
        auth_service = AuthService(user_repository, app.config['SECRET_KEY'])
        customer_service = CustomerService(customer_repository)
        pdf_service = PDFService()
        account_service = AccountService(account_repository)
        client_service = ClientService(client_repository)
        owner_service = OwnerService(owner_repository)
        property_service = PropertyService(property_repository)
        bulk_account_service = BulkAccountCreationService(
            account_repository, client_repository, property_repository, owner_repository
        )
        document_service = DocumentService()
        template_service = TemplateService(template_repository)

        # Controller Layer
        auth_controller = AuthController(auth_service)
        customer_controller = CustomerController(customer_service, auth_service)
        pdf_controller = PDFController(pdf_service, customer_service, auth_service)
        
        # Register account controller with routes
        account_controller(
            app, account_service, bulk_account_service, auth_service, db,
            valuation_repository=valuation_repository,
            document_service=document_service,
            client_service=client_service,
            owner_service=owner_service,
            property_service=property_service,
            user_repository=user_repository,
        )

        # Register template controller
        template_controller(app, template_service, auth_service)

        # Register settings controller
        settings_controller(app, db, auth_service)

        print("✓ Controllers, Services, and Repositories initialized")
    except Exception as e:
        print(f"✗ Error initializing layers: {e}")

# Routes

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    return auth_controller.register()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    return auth_controller.login()

@app.route('/api/auth/profile', methods=['GET'])
def get_profile():
    """Get user profile (protected route)"""
    return auth_controller.get_profile()

# Customer Routes
@app.route('/api/customers', methods=['POST'])
def create_customer():
    """Create a new customer"""
    return customer_controller.create_customer()

@app.route('/api/customers', methods=['GET'])
def get_all_customers():
    """Get all customers"""
    return customer_controller.get_all_customers()

@app.route('/api/customers/search', methods=['GET'])
def search_customers():
    """Search customers"""
    return customer_controller.search_customers()

@app.route('/api/customers/statistics', methods=['GET'])
def get_statistics():
    """Get customer statistics"""
    return customer_controller.get_statistics()

@app.route('/api/customers/<customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get a single customer"""
    return customer_controller.get_customer(customer_id)

@app.route('/api/customers/<customer_id>', methods=['PUT'])
def update_customer(customer_id):
    """Update a customer"""
    return customer_controller.update_customer(customer_id)

@app.route('/api/customers/<customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete a customer"""
    return customer_controller.delete_customer(customer_id)

# PDF Generation Routes
@app.route('/api/customers/<customer_id>/pdf/letterhead', methods=['GET'])
def generate_letterhead_pdf(customer_id):
    """Generate letterhead PDF for a customer"""
    return pdf_controller.generate_letterhead_pdf(customer_id)

@app.route('/api/customers/<customer_id>/pdf/cover', methods=['GET'])
def generate_cover_pdf(customer_id):
    """Generate cover PDF for a customer"""
    return pdf_controller.generate_cover_pdf(customer_id)

@app.route('/api/customers/<customer_id>/pdf/report', methods=['GET'])
def generate_report_pdf(customer_id):
    """Generate report PDF for a customer"""
    return pdf_controller.generate_report_pdf(customer_id)

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'Backend is running'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)