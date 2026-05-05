# Frontend Architecture Documentation

## Project Structure

```
frontend/src/
├── components/                 # Reusable UI Components
│   ├── __init__.js
│   ├── LoginForm.js           # Login form component
│   ├── RegisterForm.js        # Register form component
│   └── index.js
│
├── pages/                      # Page/Screen Components
│   ├── AuthPage.js            # Authentication page (login/register)
│   ├── HomePage.js            # Home page (after login)
│   └── index.js
│
├── services/                   # API Communication Layer
│   ├── authApi.js             # Authentication API calls
│   └── index.js
│
├── hooks/                      # Custom React Hooks
│   ├── useAuth.js             # Authentication hook
│   └── index.js
│
├── context/                    # React Context (State Management)
│   ├── AuthContext.js         # Authentication context provider
│   └── index.js
│
├── utils/                      # Utility Functions
│   ├── validation.js          # Input validation helpers
│   └── index.js
│
├── constants/                  # Application Constants
│   ├── api.js                 # API endpoints and config
│   └── index.js
│
├── styles/                     # CSS Files
│   ├── AuthForm.css           # Authentication form styles
│   ├── AuthPage.css           # Auth page styles
│   └── HomePage.css           # Home page styles
│
├── App.js                      # Main app component
├── App.css                     # Main app styles
├── index.js                    # React app entry point
└── index.css                   # Global styles
```

## Layer Breakdown

### 1. **Components** (`components/`)
Reusable UI components that don't contain logic.

**Components:**
- `LoginForm.js` - Form for user login
- `RegisterForm.js` - Form for user registration

**Characteristics:**
- Receives props from parent components
- Emits callbacks for parent handling
- Focuses only on UI rendering
- Easy to test and reuse

---

### 2. **Pages** (`pages/`)
Page-level components that compose multiple components and manage page state.

**Pages:**
- `AuthPage.js` - Manages login/register switching
- `HomePage.js` - Main dashboard after login

**Characteristics:**
- Handles page-level state and logic
- Composes multiple components
- Routes between different screens
- Connects to context and services

---

### 3. **Services** (`services/`)
API communication layer for backend interactions.

**Methods:**
- `authApi.register()` - Register new user
- `authApi.login()` - Login user
- `authApi.getProfile()` - Get user profile

**Features:**
- Axios instance with interceptors
- Request/response error handling
- Automatic token injection in headers
- Centralized API configuration

---

### 4. **Context** (`context/`)
Global state management using React Context API.

**Contexts:**
- `AuthContext.js` - Manages authentication state globally

**Provides:**
- `user` - Current user data
- `token` - Authentication token
- `loading` - Loading state
- `isAuthenticated` - Authentication status
- `login()` - Function to set user
- `logout()` - Function to clear user

---

### 5. **Hooks** (`hooks/`)
Custom React hooks for component logic reuse.

**Hooks:**
- `useAuth()` - Access authentication context

**Usage:**
```javascript
const { user, token, login, logout } = useAuth();
```

---

### 6. **Utils** (`utils/`)
Utility functions for common tasks.

**Functions:**
- `validateEmail()` - Validate email format
- `validatePassword()` - Validate password strength
- `validateUsername()` - Validate username
- `formatErrorMessage()` - Format error messages
- `isValidUser()` - Check if user object is valid

---

### 7. **Constants** (`constants/`)
Application-wide constants and configuration.

**Defines:**
- `API_BASE_URL` - Base API URL
- `API_ENDPOINTS` - All API endpoints
- `STORAGE_KEYS` - localStorage keys
- `ERROR_MESSAGES` - Common error messages

---

### 8. **Styles** (`styles/`)
CSS files organized by component/page.

**Files:**
- `AuthForm.css` - Login/Register form styling
- `AuthPage.css` - Auth page layout
- `HomePage.css` - Home page layout

---

## Data Flow

```
User Interaction
    ↓
Component (LoginForm/RegisterForm)
    ↓
Page (AuthPage/HomePage)
    ↓
Service (authApi)
    ↓
Backend API
    ↓
Service returns response
    ↓
Page updates Context
    ↓
Context triggers re-render
    ↓
UI Updated
```

## API Integration Flow

```
Component calls service
    ↓
Service makes HTTP request (axios)
    ↓
Interceptor adds auth token
    ↓
Request sent to backend
    ↓
Response received
    ↓
Error interceptor handles 401
    ↓
Service returns { success, data/error }
    ↓
Component handles response
    ↓
Page updates context
```

## Authentication Flow

1. **Login/Register**
   - User enters credentials in component
   - Component calls `authApi.login()` or `authApi.register()`
   - Service sends request to backend
   - Backend returns token and user data
   - Page calls `login()` to save to context
   - Context saves to localStorage
   - App re-renders with HomePage

2. **Persistent Login**
   - App mounts → AuthProvider initializes
   - AuthProvider reads localStorage
   - Restores token and user data
   - Sets `isAuthenticated = true`
   - App renders HomePage

3. **Logout**
   - User clicks logout button
   - Page calls `logout()` function
   - Context clears localStorage
   - Context clears user and token
   - App re-renders with AuthPage

## Benefits of This Architecture

✅ **Separation of Concerns** - Each layer has a single responsibility
✅ **Scalability** - Easy to add new pages, components, and services
✅ **Reusability** - Components and utilities can be used multiple times
✅ **Maintainability** - Clear structure makes code easy to find and modify
✅ **Testability** - Each layer can be tested independently
✅ **Performance** - Context only re-renders when auth state changes
✅ **Global State** - Auth context available to any component via useAuth hook

## Adding New Features

### Add a new API call:
1. Add endpoint to `constants/api.js`
2. Create method in `services/authApi.js`
3. Use in components or pages

### Add a new page:
1. Create page component in `pages/`
2. Import components and hooks
3. Add route in `App.js`

### Add a new reusable component:
1. Create in `components/`
2. Make it accept props
3. Export from `components/index.js`
4. Use in pages

### Add a new custom hook:
1. Create in `hooks/`
2. Implement logic
3. Export from `hooks/index.js`
4. Use in components

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Visit `http://localhost:3000` to see the app.

## Testing

```bash
# Run tests
npm test

# Build for production
npm run build
```

## Key Patterns Used

- **Container Component Pattern** - Pages manage state, components are presentational
- **Custom Hooks Pattern** - Reusable logic via hooks
- **Context API Pattern** - Global state management
- **Service Layer Pattern** - Encapsulated API calls
- **Utility Functions Pattern** - Reusable helper functions
