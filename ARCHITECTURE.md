# Backend Architecture Documentation

## Project Structure

```
backend/
├── main.py                      # Application entry point
├── requirements.txt             # Python dependencies
├── .env                        # Environment variables
├── seed_admin.py               # Admin user seeding script
│
├── models/                     # Data Models (Database Schema)
│   ├── __init__.py
│   └── user_model.py          # User model definition
│
├── repositories/               # Data Access Layer (Database Operations)
│   ├── __init__.py
│   └── user_repository.py     # User CRUD operations
│
├── services/                   # Business Logic Layer
│   ├── __init__.py
│   └── auth_service.py        # Authentication logic
│
└── controllers/                # API Route Handlers
    ├── __init__.py
    └── auth_controller.py     # Authentication endpoints
```

## Architecture Layers

### 1. **Models** (`models/`)
Defines the structure and schema of database collections.

**Files:**
- `user_model.py` - User collection structure with fields and conversion methods

**Purpose:**
- Define data structures
- Provide serialization/deserialization methods
- Document collection fields

---

### 2. **Repositories** (`repositories/`)
Data access layer that communicates directly with MongoDB.

**Files:**
- `user_repository.py` - CRUD operations for users

**Methods:**
- `create_user()` - Insert new user
- `find_by_email()` - Find user by email
- `find_by_username()` - Find user by username
- `find_by_id()` - Find user by ID
- `update_user()` - Update user data
- `delete_user()` - Delete user
- `get_all_users()` - Get all users with pagination
- `user_exists()` - Check if user exists

**Purpose:**
- Encapsulate all database queries
- Handle MongoDB operations
- Maintain database indexes
- Abstract database complexity from business logic

---

### 3. **Services** (`services/`)
Business logic layer that contains core application logic.

**Files:**
- `auth_service.py` - Authentication business logic

**Methods:**
- `hash_password()` - Hash password with bcrypt
- `verify_password()` - Verify password
- `generate_token()` - Create JWT token
- `verify_token()` - Validate JWT token
- `register_user()` - User registration logic
- `login_user()` - User authentication logic
- `get_user_profile()` - Retrieve user profile

**Purpose:**
- Implement business rules
- Handle validation
- Coordinate between repositories
- Provide reusable logic for multiple controllers

---

### 4. **Controllers** (`controllers/`)
API route handlers that manage HTTP requests and responses.

**Files:**
- `auth_controller.py` - Authentication endpoints

**Methods:**
- `register()` - POST /api/auth/register
- `login()` - POST /api/auth/login
- `get_profile()` - GET /api/auth/profile (protected)

**Purpose:**
- Handle HTTP requests/responses
- Route requests to appropriate services
- Format responses for clients
- Implement authentication decorators

---

## Data Flow

```
HTTP Request
    ↓
Controller (Accepts request)
    ↓
Service (Processes business logic)
    ↓
Repository (Interacts with database)
    ↓
MongoDB (Data storage)
    ↓
Repository (Returns data)
    ↓
Service (Formats response)
    ↓
Controller (Returns HTTP response)
    ↓
HTTP Response
```

## API Endpoints

### POST /api/auth/register
- **Controller:** `auth_controller.register()`
- **Service:** `auth_service.register_user()`
- **Repository:** `user_repository.create_user()`

### POST /api/auth/login
- **Controller:** `auth_controller.login()`
- **Service:** `auth_service.login_user()`
- **Repository:** `user_repository.find_by_email()`

### GET /api/auth/profile (Protected)
- **Controller:** `auth_controller.get_profile()`
- **Service:** `auth_service.get_user_profile()`
- **Repository:** `user_repository.find_by_id()`

### GET /api/health
- Returns: `{ "status": "Backend is running" }`

## Benefits of This Architecture

✅ **Separation of Concerns** - Each layer has a single responsibility
✅ **Maintainability** - Easy to locate and modify code
✅ **Testability** - Each layer can be tested independently
✅ **Reusability** - Services can be used by multiple controllers
✅ **Scalability** - Easy to add new features and endpoints
✅ **Database Abstraction** - Repository pattern isolates database logic
✅ **Business Logic Isolation** - Services contain pure business rules

## Adding New Features

### To add a new entity (e.g., Project):

1. **Create Model** - `models/project_model.py`
2. **Create Repository** - `repositories/project_repository.py`
3. **Create Service** - `services/project_service.py`
4. **Create Controller** - `controllers/project_controller.py`
5. **Update main.py** - Add new routes

## Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Seed admin user
python seed_admin.py

# Start application
python main.py
```

## Testing Each Layer

```python
# Test Repository
user_repo = UserRepository(db)
user = user_repo.find_by_email('admin@infrabase.com')

# Test Service
auth_service = AuthService(user_repo, 'secret')
success, msg, data = auth_service.login_user('admin@infrabase.com', 'admin123')

# Test Controller
auth_controller = AuthController(auth_service)
# Controllers are tested via HTTP requests
```

## Environment Variables

```
MONGO_URI=mongodb://localhost:27017/infrabase
JWT_SECRET=your_secret_key_change_this
FLASK_ENV=development
```
