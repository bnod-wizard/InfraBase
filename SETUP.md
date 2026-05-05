# InfraBase - Authentication Setup Guide

## Project Structure
```
InfraBase/
├── backend/           # Python Flask backend with MongoDB
│   ├── main.py       # Flask app with authentication endpoints
│   ├── requirements.txt
│   └── .env          # Environment configuration
└── frontend/         # React frontend with login/register pages
    ├── src/
    │   ├── App.js
    │   ├── LoginPage.js
    │   ├── RegisterPage.js
    │   └── ...
    └── package.json
```

## Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB 4.0+ (running locally or on Atlas)

## Backend Setup

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure MongoDB
Make sure MongoDB is running. Update `.env` if needed:
```
MONGO_URI=mongodb://localhost:27017/infrabase
JWT_SECRET=your_secret_key_change_this
FLASK_ENV=development
```

For MongoDB Atlas:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/infrabase
```

### 3. Start Backend Server
```bash
cd backend
python main.py
```
Backend runs on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start React Development Server
```bash
npm start
```
Frontend runs on `http://localhost:3000`

## API Endpoints

### Authentication

**Register User**
- **POST** `/api/auth/register`
- Body: `{ "username": "user", "email": "user@example.com", "password": "pass123" }`
- Response: `{ "token": "jwt_token", "user": {...} }`

**Login User**
- **POST** `/api/auth/login`
- Body: `{ "email": "user@example.com", "password": "pass123" }`
- Response: `{ "token": "jwt_token", "user": {...} }`

**Get User Profile** (Protected)
- **GET** `/api/auth/profile`
- Headers: `Authorization: Bearer <token>`
- Response: `{ "user": {...} }`

**Health Check**
- **GET** `/api/health`
- Response: `{ "status": "Backend is running" }`

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed with bcrypt),
  created_at: Date,
  updated_at: Date
}
```

## Features

✓ User registration with validation
✓ Secure login with JWT authentication
✓ Password hashing with bcrypt
✓ Protected API routes
✓ Persistent login (localStorage)
✓ Beautiful UI with gradient design
✓ Error handling and validation
✓ Token expiration (7 days)

## Security Features

- Passwords hashed with bcrypt
- JWT token-based authentication
- CORS enabled for frontend communication
- Token expiration after 7 days
- Email and username uniqueness constraints
- Input validation on both frontend and backend

## Frontend Features

- Clean login/register interface
- Auto-login on page refresh (token validation)
- User profile display
- Logout functionality
- Error messages for failed attempts
- Loading states during requests
- Form validation

## Next Steps

1. Integrate protected routes in the frontend
2. Add profile edit functionality
3. Implement password reset feature
4. Add email verification
5. Create admin dashboard
6. Add more user fields (profile picture, bio, etc.)

## Troubleshooting

**MongoDB Connection Error**
- Make sure MongoDB is running: `mongod`
- Check MONGO_URI in .env file
- Verify MongoDB is accessible

**CORS Error in Frontend**
- Ensure backend is running on port 5000
- Check that Flask-CORS is installed
- Clear browser cache and restart servers

**Port Already in Use**
- Backend: Change port in main.py if 5000 is taken
- Frontend: Change port with `PORT=3001 npm start`

**Token Issues**
- Clear localStorage and login again
- Check JWT_SECRET in .env
- Verify token hasn't expired (7 day expiration)
