# Customer Management System - InfraBase

## Overview

This is a comprehensive customer management system built with React (frontend) and Flask (backend). It includes features for managing customers, generating professional PDF documents, and tracking customer information.

## Features

### ✅ Customer Management
- **Add Customers**: Create new customer records with complete information
- **View Customers**: Browse all customers in a responsive table with pagination
- **Edit Customers**: Update customer information
- **Delete Customers**: Remove customer records
- **Search**: Search customers by name, email, company, or phone
- **Filter**: Filter customers by status (Active, Inactive, Prospect)

### 📄 PDF Generation
- **Letterhead PDF**: Generate professional letterhead documents with customer information
- **Cover PDF**: Generate cover page documents for customer files
- **Report PDF**: Generate comprehensive customer information reports

### 🎨 User Interface
- **Sidebar Navigation**: Easy navigation between Home and Customers
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Clean Layout**: Professional UI with intuitive controls

## Project Structure

### Backend

```
backend/
├── main.py                          # Application entry point
├── requirements.txt                 # Python dependencies
├── models/
│   ├── __init__.py
│   └── customer_model.py           # Customer data model
├── repositories/
│   ├── __init__.py
│   └── customer_repository.py      # Database operations
├── services/
│   ├── __init__.py
│   ├── customer_service.py         # Business logic
│   └── pdf_service.py              # PDF generation
├── controllers/
│   ├── __init__.py
│   └── customer_controller.py      # API endpoints
│   └── pdf_controller.py           # PDF endpoints
└── documents_reference/            # Reference documents
    ├── Photo.doc.docx
    ├── letter head.docx
    ├── cover 1.doc
    └── Lila.xlsx
```

### Frontend

```
frontend/src/
├── components/
│   ├── Sidebar.js                 # Navigation sidebar
│   ├── CustomerList.js            # Customer listing
│   ├── CustomerDetail.js          # Customer details/edit
│   ├── LoginForm.js
│   └── RegisterForm.js
├── pages/
│   ├── HomePage.js                # Dashboard
│   ├── CustomersPage.js           # Customers list page
│   ├── CustomerDetailPage.js      # Customer detail page
│   ├── AuthPage.js
├── styles/
│   ├── Sidebar.css
│   ├── CustomerList.css
│   ├── CustomerDetail.css
│   ├── HomePage.css
│   └── ...
├── constants/
│   └── api.js                     # API configuration
└── hooks/
    └── useAuth.js
```

## Customer Fields

Each customer record contains:

- **Basic Information**
  - Name (required)
  - Email (required)
  - Phone (required)
  - Company
  - Position

- **Address Information**
  - Street Address
  - City
  - State/Province
  - Zip/Postal Code
  - Country

- **Additional Information**
  - Website
  - Industry
  - Status (Active, Inactive, Prospect)
  - Notes

## API Endpoints

### Customer Management

- `POST /api/customers` - Create a new customer
- `GET /api/customers` - Get all customers (with pagination and filtering)
- `GET /api/customers/<customer_id>` - Get a single customer
- `PUT /api/customers/<customer_id>` - Update a customer
- `DELETE /api/customers/<customer_id>` - Delete a customer
- `GET /api/customers/search?q=<query>` - Search customers
- `GET /api/customers/statistics` - Get customer statistics

### PDF Generation

- `GET /api/customers/<customer_id>/pdf/letterhead` - Generate letterhead PDF
- `GET /api/customers/<customer_id>/pdf/cover` - Generate cover PDF
- `GET /api/customers/<customer_id>/pdf/report` - Generate report PDF

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv_new
   source venv_new/bin/activate  # On Windows: venv_new\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```
   MONGO_URI=mongodb://localhost:27017/infrabase
   JWT_SECRET=your-secret-key
   ```

5. Run the application:
   ```bash
   python main.py
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The frontend will open at `http://localhost:3000`

## Usage

1. **Register/Login**: Create an account or login to access the system
2. **Navigate to Customers**: Click on "Customers" in the sidebar
3. **Add Customer**: Click "Add New Customer" button
4. **View/Edit**: Click "View" to see customer details or click "Edit" to modify
5. **Generate PDFs**: In the customer detail page, click "Download [Type] PDF" buttons
6. **Search/Filter**: Use the search bar or status filter to find customers
7. **Delete**: Click "Delete Customer" button to remove a customer

## Technology Stack

### Backend
- **Flask 3.0.0** - Web framework
- **MongoDB** - Database
- **PyJWT** - JWT authentication
- **bcrypt** - Password hashing
- **ReportLab** - PDF generation
- **Pillow** - Image processing

### Frontend
- **React 19** - UI library
- **React Router 6** - Navigation
- **CSS3** - Styling

## PDF Generation Details

The system generates three types of PDFs:

### 1. Letterhead PDF
A professional letterhead format with:
- Company header
- Current date
- Recipient information
- Contact details table
- Additional notes

### 2. Cover PDF
A cover page format with:
- Title
- Large customer name display
- Company and position
- Quick contact information
- Generated date

### 3. Report PDF
A comprehensive report format with:
- Full customer details table
- Address information section
- Additional notes
- Generation timestamp

## References

The following reference documents were included in the project:

- `Photo.doc.docx` - Photo/image reference
- `letter head.docx` - Letterhead template reference
- `cover 1.doc` - Cover page template reference
- `Lila.xlsx` - Sample customer data in Excel format

These are stored in `backend/documents_reference/` for future customization of PDF templates.

## Authentication

All customer-related endpoints require authentication with a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are generated upon login and expire after 7 days.

## Error Handling

The system includes comprehensive error handling:
- Validation errors for required fields
- Duplicate prevention for customer emails
- Authentication and authorization checks
- Detailed error messages for debugging

## Future Enhancements

Potential improvements:
- Export customers to CSV/Excel
- Bulk customer import
- Advanced filtering and sorting
- Customer activity history
- Notes/timeline for customer interactions
- Multiple users and team collaboration
- Custom PDF templates
- Email notifications
- Integration with CRM systems

## Support

For issues or questions, please refer to:
- Backend logs in console
- Browser console for frontend errors
- API responses for detailed error messages
