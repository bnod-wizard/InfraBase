"""
Account Controller - API endpoints for Account operations
"""
from flask import request, jsonify
from datetime import datetime
from functools import wraps


def account_controller(app, account_service, bulk_account_service, auth_service):
    """Register account-related routes"""

    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                try:
                    token = auth_header.split(" ")[1]
                except IndexError:
                    return jsonify({'error': 'Invalid token format'}), 401

            if not token:
                return jsonify({'error': 'Token is missing'}), 401

            try:
                payload = auth_service.verify_token(token)
                if not payload or 'user_id' not in payload:
                    return jsonify({'error': 'Invalid token'}), 401
                request.user_id = payload['user_id']
            except Exception as e:
                return jsonify({'error': str(e)}), 401

            return f(*args, **kwargs)
        return decorated

    # Create account (single)
    @app.route('/api/accounts', methods=['POST'])
    @token_required
    def create_account():
        try:
            data = request.get_json()
            success, message, result = account_service.create_account(data, request.user_id)
            
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 201
            else:
                return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Create account with hierarchy (bulk)
    @app.route('/api/accounts/bulk/create', methods=['POST'])
    @token_required
    def create_account_with_hierarchy():
        try:
            payload = request.get_json()
            success, message, result = bulk_account_service.create_account_with_hierarchy(
                payload, 
                request.user_id
            )
            
            if success:
                return jsonify({
                    'success': True, 
                    'message': message, 
                    'data': result
                }), 201
            else:
                return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Get account by ID
    @app.route('/api/accounts/<account_id>', methods=['GET'])
    @token_required
    def get_account(account_id):
        try:
            success, message, result = account_service.get_account(account_id)
            
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            else:
                return jsonify({'success': False, 'message': message}), 404
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Get account with hierarchy
    @app.route('/api/accounts/<account_id>/hierarchy', methods=['GET'])
    @token_required
    def get_account_hierarchy(account_id):
        try:
            success, message, result = bulk_account_service.get_account_hierarchy(account_id)
            
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            else:
                return jsonify({'success': False, 'message': message}), 404
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Get all accounts
    @app.route('/api/accounts', methods=['GET'])
    @token_required
    def get_all_accounts():
        try:
            skip = request.args.get('skip', 0, type=int)
            limit = request.args.get('limit', 10, type=int)
            
            success, message, result = account_service.get_all_accounts(skip, limit)
            
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            else:
                return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Search accounts
    @app.route('/api/accounts/search/<query>', methods=['GET'])
    @token_required
    def search_accounts(query):
        try:
            skip = request.args.get('skip', 0, type=int)
            limit = request.args.get('limit', 10, type=int)
            
            success, message, result = account_service.search_accounts(query, skip, limit)
            
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            else:
                return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Update account
    @app.route('/api/accounts/<account_id>', methods=['PUT'])
    @token_required
    def update_account(account_id):
        try:
            data = request.get_json()
            success, message, result = account_service.update_account(account_id, data)
            
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            else:
                return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Delete account
    @app.route('/api/accounts/<account_id>', methods=['DELETE'])
    @token_required
    def delete_account(account_id):
        try:
            success, message, result = account_service.delete_account(account_id)
            
            if success:
                return jsonify({'success': True, 'message': message}), 200
            else:
                return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Get account statistics
    @app.route('/api/accounts/stats/overview', methods=['GET'])
    @token_required
    def get_account_stats():
        try:
            success, message, result = account_service.get_account_statistics()
            
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            else:
                return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500
