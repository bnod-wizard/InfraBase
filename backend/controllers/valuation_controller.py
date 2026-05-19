"""
ValuationController — approval workflow endpoints.
All routes require a valid JWT (token_required from auth_controller).
"""
from flask import request, jsonify
from controllers.auth_controller import token_required


class ValuationController:

    def __init__(self, valuation_service, auth_service):
        self.svc          = valuation_service
        self.auth_service = auth_service

    # ── Queue ─────────────────────────────────────────────────────────────

    @token_required
    def get_queue(self):
        """
        GET /api/valuations/queue
        Returns pending items appropriate for the caller's role.
        """
        items = self.svc.get_queue(
            actor_role=request.user_role,
            actor_id=request.user_id,
        )
        return jsonify({'success': True, 'data': items}), 200

    @token_required
    def get_all_tracked(self):
        """
        GET /api/valuations/tracked
        Full approval history view.
        """
        items = self.svc.get_all_tracked(
            actor_role=request.user_role,
            actor_id=request.user_id,
        )
        return jsonify({'success': True, 'data': items}), 200

    # ── Transitions ───────────────────────────────────────────────────────

    @token_required
    def take_action(self, valuation_id, action):
        """
        POST /api/valuations/<valuation_id>/action/<action>
        Body: { "note": "optional comment" }
        """
        data = request.get_json() or {}
        note = data.get('note', '')

        # Resolve actor name from user_repository attached to service
        actor_name = request.user_id  # fallback
        try:
            u = self.svc.user_repo.find_by_id(request.user_id)
            if u:
                actor_name = u.get('username') or u.get('email', request.user_id)
        except Exception:
            pass

        success, message, result = self.svc.transition(
            valuation_id=valuation_id,
            action=action,
            actor_id=request.user_id,
            actor_role=request.user_role,
            actor_name=actor_name,
            note=note,
        )

        if success:
            return jsonify({'success': True, 'message': message, 'data': result}), 200
        return jsonify({'success': False, 'message': message}), 400
