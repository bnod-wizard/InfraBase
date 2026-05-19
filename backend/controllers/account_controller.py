"""
Account Controller - API endpoints for Account operations
"""
from flask import request, jsonify, send_file
from datetime import datetime
from functools import wraps
from bson import ObjectId
import io


def account_controller(app, account_service, bulk_account_service, auth_service, db=None,
                       valuation_repository=None, document_service=None,
                       client_service=None, owner_service=None, property_service=None,
                       user_repository=None, account_document_service=None,
                       account_review_repository=None, note_repository=None,
                       notification_repository=None):
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
            # Also accept token as query param (for direct download/view links)
            if not token:
                token = request.args.get('token')

            if not token:
                return jsonify({'error': 'Token is missing'}), 401

            try:
                payload = auth_service.verify_token(token)
                if not payload or 'user_id' not in payload:
                    return jsonify({'error': 'Invalid token'}), 401
                request.user_id   = payload['user_id']
                request.user_role = payload.get('role', 'user')
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
            username = _resolve_username(request.user_id)
            success, message, result = account_service.create_account(
                data, request.user_id, created_by_name=username
            )
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 201
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Create account with hierarchy (bulk)
    @app.route('/api/accounts/bulk/create', methods=['POST'])
    @token_required
    def create_account_with_hierarchy():
        try:
            payload = request.get_json()
            username = _resolve_username(request.user_id)
            success, message, result = bulk_account_service.create_account_with_hierarchy(
                payload,
                request.user_id,
                created_by_name=username,
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

    def _resolve_username(user_id):
        """Return the username for a user_id, falling back to the id string."""
        if user_repository is None:
            return user_id
        try:
            user = user_repository.find_by_id(user_id)
            return user.get('username') or user.get('email') or user_id if user else user_id
        except Exception:
            return user_id

    # Recent changelogs across all accounts (must precede /<account_id> route)
    @app.route('/api/accounts/changelog/recent', methods=['GET'])
    @token_required
    def get_recent_changelogs():
        try:
            limit = request.args.get('limit', 20, type=int)
            user_id_filter = None if getattr(request, 'user_role', 'user') == 'admin' else request.user_id
            success, message, result = account_service.get_recent_changelogs(limit, user_id=user_id_filter)
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Monthly account counts (must precede /<account_id> route)
    @app.route('/api/accounts/stats/monthly', methods=['GET'])
    @token_required
    def get_monthly_stats():
        try:
            user_id_filter = None if getattr(request, 'user_role', 'user') == 'admin' else request.user_id
            success, message, result = account_service.get_monthly_counts(user_id=user_id_filter)
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Account stats overview (must precede /<account_id> route)
    @app.route('/api/accounts/stats/overview', methods=['GET'])
    @token_required
    def get_account_stats():
        try:
            user_id_filter = None if getattr(request, 'user_role', 'user') == 'admin' else request.user_id
            success, message, result = account_service.get_stats_overview(user_id=user_id_filter)
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Document HTML preview (must precede /<account_id> route)
    @app.route('/api/accounts/<account_id>/preview/<doc_type>', methods=['GET'])
    @token_required
    def preview_document(account_id, doc_type):
        try:
            if document_service is None:
                return jsonify({'success': False, 'message': 'Document service not available'}), 503

            ok, msg, hierarchy = bulk_account_service.get_account_hierarchy(account_id)
            if not ok:
                return jsonify({'success': False, 'message': msg}), 404

            valuation = {}
            if valuation_repository:
                records = valuation_repository.find_by_account(account_id)
                if records:
                    from models.valuation_model import ValuationModel
                    valuation = ValuationModel.to_json(records[0])

            # Enrich valuation with fresh settings data using stored IDs
            settings_col = db['settings']
            if valuation.get('bank_id'):
                try:
                    bank = settings_col.find_one({'_id': ObjectId(valuation['bank_id'])})
                    if bank:
                        valuation.update({
                            'bank_name': bank.get('name') or valuation.get('bank_name'),
                            'bank_branch': bank.get('branch') or valuation.get('bank_branch'),
                            'bank_address': bank.get('address') or valuation.get('bank_address'),
                        })
                except Exception:
                    pass
            if valuation.get('certifier_id'):
                try:
                    certifier = settings_col.find_one({'_id': ObjectId(valuation['certifier_id'])})
                    if certifier:
                        valuation.update({
                            'certifier_name': certifier.get('name') or valuation.get('certifier_name'),
                            'certifier_phone': certifier.get('phone') or valuation.get('certifier_phone'),
                            'nec_no': certifier.get('nec_no') or valuation.get('nec_no'),
                            'nec_class': certifier.get('nec_class') or valuation.get('nec_class'),
                            'nec_type': certifier.get('nec_type') or valuation.get('nec_type'),
                            'firm_name': certifier.get('firm_name') or valuation.get('firm_name'),
                            'firm_address': certifier.get('firm_address') or valuation.get('firm_address'),
                            'firm_phone': certifier.get('firm_phone') or valuation.get('firm_phone'),
                            'firm_email': certifier.get('firm_email') or valuation.get('firm_email'),
                        })
                except Exception:
                    pass
            if valuation.get('visitor_id'):
                try:
                    visitor = settings_col.find_one({'_id': ObjectId(valuation['visitor_id'])})
                    if visitor:
                        valuation.update({
                            'site_visited_by': visitor.get('name') or valuation.get('site_visited_by'),
                            'site_visitor_phone': visitor.get('phone') or valuation.get('site_visitor_phone'),
                        })
                except Exception:
                    pass

            # Filter hierarchy by user-selected scope
            sel_clients = valuation.get('selected_client_ids') or []
            sel_owners  = valuation.get('selected_owner_ids')  or []
            sel_props   = valuation.get('selected_property_ids') or []
            if sel_clients:
                hierarchy['clients'] = [c for c in hierarchy.get('clients', []) if c.get('_id') in sel_clients]
            if sel_owners:
                hierarchy['owners']  = [o for o in hierarchy.get('owners', [])  if o.get('_id') in sel_owners]
            if sel_props:
                hierarchy['properties'] = [p for p in hierarchy.get('properties', []) if p.get('_id') in sel_props]

            import io as _io, mammoth
            doc_bytes = document_service.generate(doc_type, hierarchy, valuation)
            result    = mammoth.convert_to_html(_io.BytesIO(doc_bytes))
            return jsonify({'success': True, 'html': result.value, 'doc_type': doc_type}), 200

        except ImportError:
            return jsonify({'success': False, 'message': 'Preview requires mammoth: pip install mammoth'}), 503
        except ValueError as e:
            return jsonify({'success': False, 'message': str(e)}), 400
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
                account = result.get('account', {})
                if not account.get('created_by_name') and account.get('created_by'):
                    account['created_by_name'] = _resolve_username(account['created_by'])
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

    # Get accounts with filters and search
    @app.route('/api/accounts/list/filtered', methods=['GET'])
    @token_required
    def get_accounts_filtered():
        try:
            query = request.args.get('q', '', type=str)
            skip = request.args.get('skip', 0, type=int)
            limit = request.args.get('limit', 10, type=int)
            
            # Parse status filters from comma-separated string
            status_str = request.args.get('status', '', type=str)
            status_filters = [s.strip() for s in status_str.split(',')] if status_str else None
            
            user_id_filter = None if getattr(request, 'user_role', 'user') == 'admin' else request.user_id
            success, message, result = account_service.get_accounts_with_filters(
                query, status_filters, skip, limit, user_id=user_id_filter
            )
            
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
            username = _resolve_username(request.user_id)
            success, message, result = account_service.update_account(
                account_id, data,
                changed_by=request.user_id, changed_by_name=username
            )
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Delete account
    @app.route('/api/accounts/<account_id>', methods=['DELETE'])
    @token_required
    def delete_account(account_id):
        try:
            username = _resolve_username(request.user_id)
            success, message, result = account_service.delete_account(
                account_id, changed_by=request.user_id, changed_by_name=username
            )
            if success:
                return jsonify({'success': True, 'message': message}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Valuation report (get / upsert) ──────────────────────────────────────
    @app.route('/api/accounts/<account_id>/valuation', methods=['GET'])
    @token_required
    def get_valuation(account_id):
        try:
            if valuation_repository is None:
                return jsonify({'success': False, 'message': 'Valuation service not available'}), 503
            records = valuation_repository.find_by_account(account_id)
            from models.valuation_model import ValuationModel
            data = [ValuationModel.to_json(r) for r in records]
            return jsonify({'success': True, 'data': data[0] if data else {}}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/accounts/<account_id>/valuation', methods=['POST', 'PUT'])
    @token_required
    def save_valuation(account_id):
        try:
            if valuation_repository is None:
                return jsonify({'success': False, 'message': 'Valuation service not available'}), 503
            from models.valuation_model import ValuationModel
            payload = request.get_json()
            payload['account_id'] = account_id
            payload['created_by'] = request.user_id
            record = ValuationModel.to_dict(payload)
            _id = valuation_repository.upsert_for_account(account_id, record)
            saved = valuation_repository.find_by_id(_id)
            return jsonify({'success': True, 'data': ValuationModel.to_json(saved)}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Document generation ───────────────────────────────────────────────────
    @app.route('/api/accounts/<account_id>/generate/<doc_type>', methods=['GET'])
    @token_required
    def generate_document(account_id, doc_type):
        try:
            if document_service is None:
                return jsonify({'success': False, 'message': 'Document service not available'}), 503

            # Fetch hierarchy
            ok, msg, hierarchy = bulk_account_service.get_account_hierarchy(account_id)
            if not ok:
                return jsonify({'success': False, 'message': msg}), 404

            # Fetch valuation metadata (may be empty)
            valuation = {}
            if valuation_repository:
                records = valuation_repository.find_by_account(account_id)
                if records:
                    from models.valuation_model import ValuationModel
                    valuation = ValuationModel.to_json(records[0])

            # Enrich valuation with fresh settings data using stored IDs
            settings_col = db['settings']
            if valuation.get('bank_id'):
                try:
                    bank = settings_col.find_one({'_id': ObjectId(valuation['bank_id'])})
                    if bank:
                        valuation.update({
                            'bank_name': bank.get('name') or valuation.get('bank_name'),
                            'bank_branch': bank.get('branch') or valuation.get('bank_branch'),
                            'bank_address': bank.get('address') or valuation.get('bank_address'),
                        })
                except Exception:
                    pass
            if valuation.get('certifier_id'):
                try:
                    certifier = settings_col.find_one({'_id': ObjectId(valuation['certifier_id'])})
                    if certifier:
                        valuation.update({
                            'certifier_name': certifier.get('name') or valuation.get('certifier_name'),
                            'certifier_phone': certifier.get('phone') or valuation.get('certifier_phone'),
                            'nec_no': certifier.get('nec_no') or valuation.get('nec_no'),
                            'nec_class': certifier.get('nec_class') or valuation.get('nec_class'),
                            'nec_type': certifier.get('nec_type') or valuation.get('nec_type'),
                            'firm_name': certifier.get('firm_name') or valuation.get('firm_name'),
                            'firm_address': certifier.get('firm_address') or valuation.get('firm_address'),
                            'firm_phone': certifier.get('firm_phone') or valuation.get('firm_phone'),
                            'firm_email': certifier.get('firm_email') or valuation.get('firm_email'),
                        })
                except Exception:
                    pass
            if valuation.get('visitor_id'):
                try:
                    visitor = settings_col.find_one({'_id': ObjectId(valuation['visitor_id'])})
                    if visitor:
                        valuation.update({
                            'site_visited_by': visitor.get('name') or valuation.get('site_visited_by'),
                            'site_visitor_phone': visitor.get('phone') or valuation.get('site_visitor_phone'),
                        })
                except Exception:
                    pass

            # Filter hierarchy by user-selected scope
            sel_clients = valuation.get('selected_client_ids') or []
            sel_owners  = valuation.get('selected_owner_ids')  or []
            sel_props   = valuation.get('selected_property_ids') or []
            if sel_clients:
                hierarchy['clients'] = [c for c in hierarchy.get('clients', []) if c.get('_id') in sel_clients]
            if sel_owners:
                hierarchy['owners']  = [o for o in hierarchy.get('owners', [])  if o.get('_id') in sel_owners]
            if sel_props:
                hierarchy['properties'] = [p for p in hierarchy.get('properties', []) if p.get('_id') in sel_props]

            doc_bytes = document_service.generate(doc_type, hierarchy, valuation)

            account_name = hierarchy['account'].get('account_name', 'document').replace(' ', '_')
            filename = f'{account_name}_{doc_type}.docx'

            return send_file(
                io.BytesIO(doc_bytes),
                as_attachment=True,
                download_name=filename,
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
        except ValueError as e:
            return jsonify({'success': False, 'message': str(e)}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Client update ─────────────────────────────────────────────────────────
    @app.route('/api/clients/<client_id>', methods=['PUT'])
    @token_required
    def update_client(client_id):
        try:
            if client_service is None:
                return jsonify({'success': False, 'message': 'Client service not available'}), 503
            data = request.get_json()
            success, message, result = client_service.update_client(client_id, data)
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Client create ─────────────────────────────────────────────────────────
    @app.route('/api/accounts/<account_id>/clients', methods=['POST'])
    @token_required
    def create_client(account_id):
        try:
            if client_service is None:
                return jsonify({'success': False, 'message': 'Client service not available'}), 503
            data = request.get_json()
            data['account_id'] = account_id
            user_id = request.user_id if hasattr(request, 'user_id') else None
            success, message, result = client_service.create_client(data, user_id)
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 201
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Owner update ──────────────────────────────────────────────────────────
    @app.route('/api/owners/<owner_id>', methods=['PUT'])
    @token_required
    def update_owner(owner_id):
        try:
            if owner_service is None:
                return jsonify({'success': False, 'message': 'Owner service not available'}), 503
            data = request.get_json()
            success, message, result = owner_service.update_owner(owner_id, data)
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Owner create ──────────────────────────────────────────────────────────
    @app.route('/api/accounts/<account_id>/owners', methods=['POST'])
    @token_required
    def create_owner(account_id):
        try:
            if owner_service is None:
                return jsonify({'success': False, 'message': 'Owner service not available'}), 503
            data = request.get_json()
            data['account_id'] = account_id
            user_id = request.user_id if hasattr(request, 'user_id') else None
            success, message, result = owner_service.create_owner(data, user_id)
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 201
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Property create ───────────────────────────────────────────────────────
    @app.route('/api/accounts/<account_id>/properties', methods=['POST'])
    @token_required
    def create_property(account_id):
        try:
            if property_service is None:
                return jsonify({'success': False, 'message': 'Property service not available'}), 503
            data = request.get_json()
            data['account_id'] = account_id
            user_id = request.user_id if hasattr(request, 'user_id') else None
            success, message, result = property_service.create_property(data, user_id)
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 201
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Property update ───────────────────────────────────────────────────────
    @app.route('/api/properties/<property_id>', methods=['PUT'])
    @token_required
    def update_property(property_id):
        try:
            if property_service is None:
                return jsonify({'success': False, 'message': 'Property service not available'}), 503
            data = request.get_json()
            success, message, result = property_service.update_property(property_id, data)
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # Get account changelog
    @app.route('/api/accounts/<account_id>/changelog', methods=['GET'])
    @token_required
    def get_account_changelog(account_id):
        try:
            limit = int(request.args.get('limit', 10))
            success, message, result = account_service.get_account_changelog(account_id, limit)
            
            if success:
                return jsonify({'success': True, 'message': message, 'data': result}), 200
            else:
                return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Account Documents ─────────────────────────────────────────────────────

    @app.route('/api/accounts/<account_id>/documents', methods=['GET'])
    @token_required
    def list_account_documents(account_id):
        try:
            if account_document_service is None:
                return jsonify({'success': False, 'message': 'Document storage not available'}), 503
            docs = account_document_service.list_for_account(account_id)
            return jsonify({'success': True, 'data': docs}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/accounts/<account_id>/documents', methods=['POST'])
    @token_required
    def upload_account_document(account_id):
        try:
            if account_document_service is None:
                return jsonify({'success': False, 'message': 'Document storage not available'}), 503
            if 'file' not in request.files:
                return jsonify({'success': False, 'message': 'No file provided'}), 400
            file_obj  = request.files['file']
            doc_type  = request.form.get('doc_type', 'other')
            description = request.form.get('description', '')
            username  = _resolve_username(request.user_id)
            doc = account_document_service.upload(
                account_id, file_obj, doc_type, description,
                uploaded_by=request.user_id, uploaded_by_name=username
            )
            return jsonify({'success': True, 'message': 'File uploaded', 'data': doc}), 201
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/accounts/<account_id>/documents/<doc_id>', methods=['PUT'])
    @token_required
    def update_account_document(account_id, doc_id):
        try:
            if account_document_service is None:
                return jsonify({'success': False, 'message': 'Document storage not available'}), 503
            updates = request.get_json() or {}
            doc = account_document_service.update_meta(doc_id, updates)
            if not doc:
                return jsonify({'success': False, 'message': 'Document not found'}), 404
            return jsonify({'success': True, 'message': 'Updated', 'data': doc}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/accounts/<account_id>/documents/<doc_id>', methods=['DELETE'])
    @token_required
    def delete_account_document(account_id, doc_id):
        try:
            if account_document_service is None:
                return jsonify({'success': False, 'message': 'Document storage not available'}), 503
            meta_only = request.args.get('meta_only', 'false').lower() == 'true'
            ok = account_document_service.delete_meta_only(doc_id) if meta_only else account_document_service.delete(doc_id)
            if not ok:
                return jsonify({'success': False, 'message': 'Document not found'}), 404
            return jsonify({'success': True, 'message': 'Deleted'}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/accounts/<account_id>/documents/<doc_id>/download', methods=['GET'])
    @token_required
    def download_account_document(account_id, doc_id):
        try:
            if account_document_service is None:
                return jsonify({'success': False, 'message': 'Document storage not available'}), 503
            url, _ = account_document_service.get_presigned_url(doc_id, inline=False)
            if not url:
                return jsonify({'success': False, 'message': 'File not found'}), 404
            from flask import redirect
            return redirect(url)
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/accounts/<account_id>/documents/<doc_id>/view', methods=['GET'])
    @token_required
    def view_account_document(account_id, doc_id):
        try:
            if account_document_service is None:
                return jsonify({'success': False, 'message': 'Document storage not available'}), 503
            url, _ = account_document_service.get_presigned_url(doc_id, inline=True)
            if not url:
                return jsonify({'success': False, 'message': 'File not found'}), 404
            from flask import redirect
            return redirect(url)
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Review assignment ──────────────────────────────────────────────────

    @app.route('/api/accounts/<account_id>/assign-reviewer', methods=['POST'])
    @token_required
    def assign_reviewer(account_id):
        """Assign a reviewer to an account and set status to In-Review."""
        if account_review_repository is None:
            return jsonify({'success': False, 'message': 'Review feature unavailable'}), 503
        data = request.get_json() or {}
        reviewer_id   = data.get('reviewer_id')
        reviewer_name = data.get('reviewer_name', '')
        reviewer_email= data.get('reviewer_email', '')
        if not reviewer_id:
            return jsonify({'success': False, 'message': 'reviewer_id is required'}), 400
        try:
            # Resolve assigner name
            assigner_name = request.user_id
            if user_repository:
                u = user_repository.find_by_id(request.user_id)
                if u:
                    assigner_name = u.get('username') or u.get('email', request.user_id)

            # Resolve account name for notification message
            account_name = account_id
            try:
                _, _, acct_data = account_service.get_account(account_id)
                if acct_data:
                    account_name = acct_data.get('account_name') or account_id
            except Exception:
                pass

            account_review_repository.upsert_for_account(account_id, {
                'account_id':     str(account_id),
                'reviewer_id':    str(reviewer_id),
                'reviewer_name':  reviewer_name,
                'reviewer_email': reviewer_email,
                'assigned_by':    request.user_id,
                'assigned_by_name': assigner_name,
                'assigned_at':    datetime.utcnow(),
                'status':         'pending',
                'note':           '',
            })

            # Create notification for the reviewer
            if notification_repository:
                notification_repository.create(
                    user_id=str(reviewer_id),
                    title='You have been assigned as reviewer',
                    description=f'{assigner_name} assigned you to review "{account_name}". Please check the Review Queue.',
                    redirect_path=f'/home/accounts/{account_id}',
                )

            # Update account status to In-Review
            success, message, result = account_service.update_account(
                account_id, {'status': 'In-Review'}, request.user_id, assigner_name
            )
            if success:
                return jsonify({'success': True, 'message': 'Reviewer assigned', 'data': result}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/reviews/my-assigned', methods=['GET'])
    @token_required
    def get_my_assigned_reviews():
        """Accounts assigned to the current user for review."""
        if account_review_repository is None:
            return jsonify({'success': False, 'message': 'Review feature unavailable'}), 503
        try:
            role = getattr(request, 'user_role', 'user')
            if role == 'admin':
                assignments = account_review_repository.find_all_active()
            else:
                assignments = account_review_repository.find_by_reviewer(request.user_id)

            # Enrich with account data
            enriched = []
            for a in assignments:
                acct = None
                try:
                    success, _, acct = account_service.get_account(str(a['account_id']))
                except Exception:
                    pass
                enriched.append({
                    'review_id':      str(a['_id']),
                    'account_id':     str(a['account_id']),
                    'account_name':   (acct or {}).get('account_name') or None,
                    'account_status': (acct or {}).get('status', ''),
                    'reviewer_id':    a.get('reviewer_id'),
                    'reviewer_name':  a.get('reviewer_name'),
                    'assigned_by_name': a.get('assigned_by_name'),
                    'assigned_at':    a['assigned_at'].isoformat() if a.get('assigned_at') else None,
                    'status':         a.get('status', 'pending'),
                })
            return jsonify({'success': True, 'data': enriched}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/reviews/<account_id>/approve', methods=['POST'])
    @token_required
    def approve_review(account_id):
        """Reviewer approves — sets account status to Approved."""
        if account_review_repository is None:
            return jsonify({'success': False, 'message': 'Review feature unavailable'}), 503
        try:
            actor_name = request.user_id
            if user_repository:
                u = user_repository.find_by_id(request.user_id)
                if u:
                    actor_name = u.get('username') or u.get('email', request.user_id)

            data = request.get_json() or {}
            note = data.get('note', '')
            account_review_repository.mark_approved(account_id, request.user_id, actor_name, note)
            # Persist review note into the shared notes collection
            if note_repository and note.strip():
                note_repository.create(
                    account_id=account_id,
                    content=note.strip(),
                    created_by=request.user_id,
                    created_by_name=actor_name,
                    note_type='review',
                )
            success, message, result = account_service.update_account(
                account_id, {'status': 'Approved'}, request.user_id, actor_name
            )
            if success:
                return jsonify({'success': True, 'message': 'Account approved', 'data': result}), 200
            return jsonify({'success': False, 'message': message}), 400
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── Notes ─────────────────────────────────────────────────────────────────

    @app.route('/api/accounts/<account_id>/notes', methods=['GET'])
    @token_required
    def get_notes(account_id):
        if note_repository is None:
            return jsonify({'success': False, 'message': 'Notes unavailable'}), 503
        try:
            raw = note_repository.find_by_account(account_id)
            notes = []
            for n in raw:
                notes.append({
                    'id':               str(n['_id']),
                    'content':          n.get('content', ''),
                    'created_by':       n.get('created_by', ''),
                    'created_by_name':  n.get('created_by_name', ''),
                    'type':             n.get('type', 'manual'),
                    'created_at':       n['created_at'].isoformat() if n.get('created_at') else None,
                })
            return jsonify({'success': True, 'data': notes}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/accounts/<account_id>/notes', methods=['POST'])
    @token_required
    def add_note(account_id):
        if note_repository is None:
            return jsonify({'success': False, 'message': 'Notes unavailable'}), 503
        data = request.get_json() or {}
        content = (data.get('content') or '').strip()
        if not content:
            return jsonify({'success': False, 'message': 'content is required'}), 400
        try:
            author_name = request.user_id
            if user_repository:
                u = user_repository.find_by_id(request.user_id)
                if u:
                    author_name = u.get('username') or u.get('email', request.user_id)
            note = note_repository.create(
                account_id=account_id,
                content=content,
                created_by=request.user_id,
                created_by_name=author_name,
                note_type='manual',
            )
            return jsonify({'success': True, 'data': {
                'id':              str(note['_id']),
                'content':         note['content'],
                'created_by':      note['created_by'],
                'created_by_name': note['created_by_name'],
                'type':            note['type'],
                'created_at':      note['created_at'].isoformat(),
            }}), 201
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500
