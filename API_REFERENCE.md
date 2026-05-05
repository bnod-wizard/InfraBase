# API Reference Guide - Customer Management

## Authentication

All endpoints (except /api/health) require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get a token by logging in:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

## Customer Endpoints

### 1. Create a Customer
**POST** `/api/customers`

```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "company": "ABC Corporation",
    "position": "Sales Manager",
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA",
    "website": "https://abc-corp.com",
    "industry": "Technology",
    "notes": "Important client",
    "status": "active"
  }'
```

**Response (201 Created):**
```json
{
  "message": "Customer created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "company": "ABC Corporation",
    "position": "Sales Manager",
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA",
    "website": "https://abc-corp.com",
    "industry": "Technology",
    "notes": "Important client",
    "status": "active",
    "created_at": "2026-05-04T10:30:00",
    "updated_at": "2026-05-04T10:30:00",
    "created_by": "user_id_123"
  }
}
```

### 2. Get All Customers (with Pagination)
**GET** `/api/customers?skip=0&limit=100&status=active`

```bash
curl -X GET "http://localhost:5000/api/customers?skip=0&limit=10&status=active" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 100, max: 500)
- `status` (optional): Filter by status - `active`, `inactive`, or `prospect`

**Response (200 OK):**
```json
{
  "message": "Customers retrieved successfully",
  "data": {
    "customers": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-555-1234",
        "company": "ABC Corporation",
        "position": "Sales Manager",
        "status": "active",
        ...
      }
    ],
    "total_count": 45,
    "skip": 0,
    "limit": 10
  }
}
```

### 3. Get Single Customer
**GET** `/api/customers/<customer_id>`

```bash
curl -X GET http://localhost:5000/api/customers/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "message": "Customer retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    ...
  }
}
```

### 4. Update Customer
**PUT** `/api/customers/<customer_id>`

```bash
curl -X PUT http://localhost:5000/api/customers/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "position": "Senior Sales Manager",
    "status": "active"
  }'
```

**Note:** Only include fields you want to update. Other fields remain unchanged.

**Response (200 OK):**
```json
{
  "message": "Customer updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe Updated",
    "position": "Senior Sales Manager",
    ...
    "updated_at": "2026-05-04T11:45:00"
  }
}
```

### 5. Delete Customer
**DELETE** `/api/customers/<customer_id>`

```bash
curl -X DELETE http://localhost:5000/api/customers/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "message": "Customer deleted successfully"
}
```

### 6. Search Customers
**GET** `/api/customers/search?q=john`

```bash
curl -X GET "http://localhost:5000/api/customers/search?q=john%20doe" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**
- `q` (required): Search term (minimum 2 characters)

Searches across: name, email, company, and phone fields

**Response (200 OK):**
```json
{
  "message": "Found 3 customers",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      ...
    }
  ]
}
```

### 7. Get Statistics
**GET** `/api/customers/statistics`

```bash
curl -X GET http://localhost:5000/api/customers/statistics \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "message": "Statistics retrieved successfully",
  "data": {
    "total": 45,
    "active": 35,
    "inactive": 8,
    "prospect": 2
  }
}
```

## PDF Generation Endpoints

### 1. Download Letterhead PDF
**GET** `/api/customers/<customer_id>/pdf/letterhead`

```bash
curl -X GET http://localhost:5000/api/customers/507f1f77bcf86cd799439011/pdf/letterhead \
  -H "Authorization: Bearer <token>" \
  --output letterhead_john_doe.pdf
```

**Response:** PDF file download

### 2. Download Cover PDF
**GET** `/api/customers/<customer_id>/pdf/cover`

```bash
curl -X GET http://localhost:5000/api/customers/507f1f77bcf86cd799439011/pdf/cover \
  -H "Authorization: Bearer <token>" \
  --output cover_john_doe.pdf
```

**Response:** PDF file download

### 3. Download Report PDF
**GET** `/api/customers/<customer_id>/pdf/report`

```bash
curl -X GET http://localhost:5000/api/customers/507f1f77bcf86cd799439011/pdf/report \
  -H "Authorization: Bearer <token>" \
  --output report_john_doe.pdf
```

**Response:** PDF file download

## Error Responses

### 400 Bad Request
```json
{
  "message": "Name, email, and phone are required"
}
```

### 401 Unauthorized
```json
{
  "message": "Token is missing"
}
```

### 404 Not Found
```json
{
  "message": "Customer not found"
}
```

### 409 Conflict
```json
{
  "message": "Customer with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error creating customer: [error details]"
}
```

## Frontend JavaScript Examples

### Using Fetch API

```javascript
// Get authentication token (after login)
const token = localStorage.getItem('authToken');

// Create customer
fetch('http://localhost:5000/api/customers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-1234',
    company: 'ABC Corp',
    status: 'active'
  })
})
.then(res => res.json())
.then(data => console.log('Customer created:', data.data))
.catch(err => console.error('Error:', err));

// Get all customers
fetch('http://localhost:5000/api/customers?skip=0&limit=100', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('Customers:', data.data.customers))
.catch(err => console.error('Error:', err));

// Update customer
fetch('http://localhost:5000/api/customers/507f1f77bcf86cd799439011', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    position: 'Senior Manager'
  })
})
.then(res => res.json())
.then(data => console.log('Customer updated:', data.data))
.catch(err => console.error('Error:', err));

// Delete customer
fetch('http://localhost:5000/api/customers/507f1f77bcf86cd799439011', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data.message))
.catch(err => console.error('Error:', err));

// Download PDF
fetch('http://localhost:5000/api/customers/507f1f77bcf86cd799439011/pdf/letterhead', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'letterhead.pdf';
  a.click();
})
.catch(err => console.error('Error:', err));
```

## Customer Status Values

- `active` - Customer is currently active
- `inactive` - Customer is not currently active
- `prospect` - Potential customer, not yet converted

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding for production.

## CORS

CORS is enabled for all origins. Consider restricting in production:
```python
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})
```

## Testing

### Quick Test with cURL
```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Copy the token from response

# 3. Create Customer (replace TOKEN)
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","email":"customer@example.com","phone":"555-1234","status":"active"}'
```
