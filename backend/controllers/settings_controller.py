"""Settings Controller — Certifiers, Banks, Site Visitors"""
from flask import request, jsonify
from bson import ObjectId
from functools import wraps

ALLOWED_TYPES = {'certifier', 'bank', 'visitor'}

def settings_controller(app, db, auth_service):
    settings_col = db['settings']

    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                try:
                    token = request.headers['Authorization'].split(" ")[1]
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

    @app.route('/api/settings/<entity_type>', methods=['GET'])
    @token_required
    def list_settings(entity_type):
        if entity_type not in ALLOWED_TYPES:
            return jsonify({'success': False, 'message': 'Invalid type'}), 400
        docs = list(settings_col.find({'type': entity_type}))
        for d in docs:
            d['_id'] = str(d['_id'])
        return jsonify({'success': True, 'data': docs}), 200

    @app.route('/api/settings/<entity_type>', methods=['POST'])
    @token_required
    def create_setting(entity_type):
        if entity_type not in ALLOWED_TYPES:
            return jsonify({'success': False, 'message': 'Invalid type'}), 400
        data = request.get_json() or {}
        data['type'] = entity_type
        result = settings_col.insert_one(data)
        data['_id'] = str(result.inserted_id)
        return jsonify({'success': True, 'data': data}), 201

    @app.route('/api/settings/entry/<entry_id>', methods=['PUT'])
    @token_required
    def update_setting(entry_id):
        try:
            data = request.get_json() or {}
            data.pop('_id', None)
            data.pop('type', None)
            settings_col.update_one({'_id': ObjectId(entry_id)}, {'$set': data})
            updated = settings_col.find_one({'_id': ObjectId(entry_id)})
            updated['_id'] = str(updated['_id'])
            return jsonify({'success': True, 'data': updated}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/settings/entry/<entry_id>', methods=['DELETE'])
    @token_required
    def delete_setting(entry_id):
        try:
            settings_col.delete_one({'_id': ObjectId(entry_id)})
            return jsonify({'success': True}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500
