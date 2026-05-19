import json
import time
from datetime import datetime
from flask import request, jsonify, Response, stream_with_context
from functools import wraps


def notification_controller(app, auth_service, notification_repository):

    # ── Auth decorator (same pattern as account_controller) ───────────────────
    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                try:
                    token = request.headers['Authorization'].split(' ')[1]
                except IndexError:
                    return jsonify({'error': 'Invalid token format'}), 401
            # EventSource can't send headers — accept token as query param too
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

    # ── Serializer ────────────────────────────────────────────────────────────
    def _serialize(n):
        return {
            'id':            str(n['_id']),
            'title':         n.get('title', ''),
            'description':   n.get('description', ''),
            'redirect_path': n.get('redirect_path', ''),
            'status':        n.get('status', 'unread'),   # unread | read | deleted
            'created_at':    n['created_at'].isoformat() if n.get('created_at') else None,
        }

    # ── REST endpoints ────────────────────────────────────────────────────────

    @app.route('/api/notifications', methods=['GET'])
    @token_required
    def get_notifications():
        items = notification_repository.find_by_user(request.user_id)
        return jsonify({'success': True, 'data': [_serialize(n) for n in items]}), 200

    @app.route('/api/notifications/unread-count', methods=['GET'])
    @token_required
    def get_unread_count():
        count = notification_repository.count_unread(request.user_id)
        return jsonify({'success': True, 'data': {'count': count}}), 200

    @app.route('/api/notifications/<notification_id>/read', methods=['POST'])
    @token_required
    def mark_read(notification_id):
        notification_repository.mark_read(notification_id, request.user_id)
        return jsonify({'success': True}), 200

    @app.route('/api/notifications/read-all', methods=['POST'])
    @token_required
    def mark_all_read():
        notification_repository.mark_all_read(request.user_id)
        return jsonify({'success': True}), 200

    @app.route('/api/notifications/<notification_id>', methods=['DELETE'])
    @token_required
    def delete_notification(notification_id):
        notification_repository.delete_notification(notification_id, request.user_id)
        return jsonify({'success': True}), 200

    # ── SSE stream ────────────────────────────────────────────────────────────

    @app.route('/api/notifications/stream', methods=['GET'])
    @token_required
    def notification_stream():
        """
        Server-Sent Events endpoint. Sends:
          { type: 'init',  notifications: [...], unread: N }   — on connect
          { type: 'new',   notification: {...},  unread: N }   — when a new one arrives
          { type: 'count', unread: N }                         — heartbeat every 15 s
        """
        user_id = request.user_id

        def generate():
            # Send current state immediately on connect
            items = notification_repository.find_by_user(user_id)
            unread = sum(1 for n in items if n.get('status') == 'unread')
            payload = json.dumps({
                'type':          'init',
                'notifications': [_serialize(n) for n in items],
                'unread':        unread,
            })
            yield f"data: {payload}\n\n"

            last_check = datetime.utcnow()
            tick = 0

            while True:
                time.sleep(3)
                tick += 1

                # Check for new notifications
                new_items = notification_repository.find_since(user_id, last_check)
                last_check = datetime.utcnow()

                for item in new_items:
                    unread_count = notification_repository.count_unread(user_id)
                    payload = json.dumps({
                        'type':         'new',
                        'notification': _serialize(item),
                        'unread':       unread_count,
                    })
                    yield f"data: {payload}\n\n"

                # Heartbeat every 15 s (every 5 ticks × 3 s) to keep unread count fresh
                if tick % 5 == 0:
                    unread_count = notification_repository.count_unread(user_id)
                    yield f"data: {json.dumps({'type': 'count', 'unread': unread_count})}\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control':   'no-cache',
                'X-Accel-Buffering': 'no',
                'Connection':      'keep-alive',
            },
        )
