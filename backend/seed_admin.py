#!/usr/bin/env python3
"""
Script to seed an admin user into MongoDB
Run this script to create an initial admin user
"""

import sys
import os
from datetime import datetime
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from pymongo import MongoClient
import bcrypt
from dotenv import load_dotenv

load_dotenv()

# Configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/infrabase')

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_admin():
    """Create an admin user"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client['infrabase']
        users_collection = db['users']
        
        # Create unique index on email
        users_collection.create_index('email', unique=True)
        users_collection.create_index('username', unique=True)
        
        print("✓ Connected to MongoDB")
        
        # Check if admin already exists
        admin = users_collection.find_one({'email': 'admin@infrabase.com'})
        if admin:
            print("⚠️  Admin user already exists!")
            print(f"   Email: {admin['email']}")
            print(f"   Username: {admin['username']}")
            return
        
        # Create admin user
        admin_user = {
            'username': 'admin',
            'email': 'admin@infrabase.com',
            'password': hash_password('admin123'),
            'role': 'admin',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = users_collection.insert_one(admin_user)
        
        print("✓ Admin user created successfully!")
        print(f"   Username: admin")
        print(f"   Email: admin@infrabase.com")
        print(f"   Password: admin123")
        print(f"   ID: {result.inserted_id}")
        print("\n⚠️  IMPORTANT: Change the password after first login!")
        
        client.close()
        
    except Exception as e:
        print(f"✗ Error: {e}")
        print("\nMake sure MongoDB is running at:", MONGO_URI)
        sys.exit(1)

if __name__ == '__main__':
    seed_admin()
