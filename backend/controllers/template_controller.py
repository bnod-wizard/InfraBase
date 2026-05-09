"""
Template Controller - API endpoints for versioned template management.
"""
import os
from flask import request, jsonify, send_file
from functools import wraps


def template_controller(app, template_service, auth_service):

    TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'templates')
    TEMPLATE_FILES = {
        'cover':      'cover_template.docx',
        'letterhead': 'letterhead_template.docx',
        'proposal':   'proposal_template.docx',
    }

    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                try:
                    token = request.headers['Authorization'].split(' ')[1]
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

    # ── List all templates ────────────────────────────────────────────────────
    @app.route('/api/templates', methods=['GET'])
    @token_required
    def get_templates():
        return jsonify({'success': True, 'data': template_service.get_all()}), 200

    # ── Create custom template ────────────────────────────────────────────────
    @app.route('/api/templates', methods=['POST'])
    @token_required
    def create_template():
        data = request.get_json() or {}
        result, error = template_service.create_custom(
            data.get('name'),
            data.get('description', ''),
            data.get('icon', '⎙'),
        )
        if error:
            return jsonify({'success': False, 'error': error}), 400
        return jsonify({'success': True, 'data': result}), 201

    # ── Get single template (all versions) ───────────────────────────────────
    @app.route('/api/templates/<template_id>', methods=['GET'])
    @token_required
    def get_template(template_id):
        t = template_service.get_by_id(template_id)
        if not t:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        return jsonify({'success': True, 'data': t}), 200

    # ── Save new version ──────────────────────────────────────────────────────
    @app.route('/api/templates/<template_id>/versions', methods=['POST'])
    @token_required
    def save_version(template_id):
        data = request.get_json() or {}
        result, error = template_service.save_version(
            template_id,
            data.get('sections', []),
            data.get('label'),
        )
        if error:
            return jsonify({'success': False, 'error': error}), 400
        return jsonify({'success': True, 'data': result}), 201

    # ── Set active version ────────────────────────────────────────────────────
    @app.route('/api/templates/<template_id>/active', methods=['PUT'])
    @token_required
    def set_active_version(template_id):
        data = request.get_json() or {}
        version_num = data.get('version')
        if version_num is None:
            return jsonify({'success': False, 'error': 'version is required'}), 400
        result, error = template_service.set_active(template_id, int(version_num))
        if error:
            return jsonify({'success': False, 'error': error}), 400
        return jsonify({'success': True, 'data': result}), 200

    # ── Delete custom template ────────────────────────────────────────────────
    @app.route('/api/templates/<template_id>', methods=['DELETE'])
    @token_required
    def delete_template(template_id):
        ok, error = template_service.delete_custom(template_id)
        if not ok:
            return jsonify({'success': False, 'error': error or 'Delete failed'}), 400
        return jsonify({'success': True}), 200

    # ── Download .docx template file ─────────────────────────────────────────
    @app.route('/api/templates/<template_id>/download', methods=['GET'])
    @token_required
    def download_template(template_id):
        filename = TEMPLATE_FILES.get(template_id)
        if not filename:
            return jsonify({'success': False, 'error': 'No file for this template'}), 404
        path = os.path.join(TEMPLATES_DIR, filename)
        if not os.path.exists(path):
            return jsonify({'success': False, 'error': 'Template file not found'}), 404
        return send_file(
            path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
