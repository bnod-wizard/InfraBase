"""
Customer Model - Database schema for customers
"""
from datetime import datetime
from bson.objectid import ObjectId


class Customer:
    """Customer data model"""
    
    # Field definitions
    FIELDS = {
        '_id': ObjectId,
        'name': str,
        'email': str,
        'phone': str,
        'company': str,
        'position': str,
        'address': str,
        'city': str,
        'state': str,
        'zip_code': str,
        'country': str,
        'website': str,
        'industry': str,
        'notes': str,
        'created_at': datetime,
        'updated_at': datetime,
        'created_by': str,  # User ID of who created this
        'status': str  # active, inactive, prospect
    }
    
    def __init__(self, name, email, phone, company='', position='', 
                 address='', city='', state='', zip_code='', country='',
                 website='', industry='', notes='', status='active', 
                 created_by=None, _id=None, created_at=None, updated_at=None):
        """
        Initialize customer
        
        Args:
            name: Customer name
            email: Customer email
            phone: Customer phone
            company: Company name
            position: Job position
            address: Street address
            city: City
            state: State/Province
            zip_code: Postal code
            country: Country
            website: Website URL
            industry: Industry type
            notes: Additional notes
            status: Customer status (active/inactive/prospect)
            created_by: User ID who created this customer
            _id: MongoDB ObjectId
            created_at: Creation timestamp
            updated_at: Last update timestamp
        """
        self._id = _id or ObjectId()
        self.name = name
        self.email = email
        self.phone = phone
        self.company = company
        self.position = position
        self.address = address
        self.city = city
        self.state = state
        self.zip_code = zip_code
        self.country = country
        self.website = website
        self.industry = industry
        self.notes = notes
        self.status = status
        self.created_by = created_by
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
    def to_dict(self):
        """Convert customer to dictionary for database storage"""
        return {
            '_id': self._id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'company': self.company,
            'position': self.position,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'country': self.country,
            'website': self.website,
            'industry': self.industry,
            'notes': self.notes,
            'status': self.status,
            'created_by': self.created_by,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create customer from dictionary (e.g., from database)"""
        if not data:
            return None
        
        return Customer(
            name=data.get('name', ''),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
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
            status=data.get('status', 'active'),
            created_by=data.get('created_by'),
            _id=data.get('_id'),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )
    
    def to_json(self):
        """Convert customer to JSON-serializable dictionary"""
        data = self.to_dict()
        # Convert ObjectId and datetime to strings for JSON serialization
        if isinstance(data['_id'], ObjectId):
            data['_id'] = str(data['_id'])
        if isinstance(data['created_at'], datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data['updated_at'], datetime):
            data['updated_at'] = data['updated_at'].isoformat()
        return data
