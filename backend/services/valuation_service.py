"""
ValuationService — approval workflow state machine.

Approval statuses:
  draft              → engineer is working on it
  submitted          → engineer submitted for reviewer
  changes_requested  → reviewer sent back with notes
  reviewed           → reviewer approved, awaiting admin sign-off
  approved           → admin signed off (final)
  rejected           → admin rejected (terminal)
"""
from datetime import datetime
from bson import ObjectId


# Which role may trigger which transition
TRANSITIONS = {
    'submit':           {'from': {'draft', 'changes_requested'}, 'roles': {'user', 'reviewer', 'admin'}, 'to': 'submitted'},
    'request_changes':  {'from': {'submitted'},                   'roles': {'reviewer', 'admin'},          'to': 'changes_requested'},
    'approve_review':   {'from': {'submitted'},                   'roles': {'reviewer', 'admin'},          'to': 'reviewed'},
    'approve_final':    {'from': {'reviewed'},                    'roles': {'admin'},                      'to': 'approved'},
    'reject':           {'from': {'submitted', 'reviewed'},       'roles': {'admin'},                      'to': 'rejected'},
}


def _serialize(v):
    """Convert a raw MongoDB valuation doc to a JSON-safe dict."""
    if not v:
        return None
    out = dict(v)
    out['id'] = str(out.pop('_id'))
    for k, val in out.items():
        if isinstance(val, datetime):
            out[k] = val.isoformat()
        elif isinstance(val, ObjectId):
            out[k] = str(val)
    # Serialise history timestamps
    for entry in out.get('approval_history', []):
        if isinstance(entry.get('at'), datetime):
            entry['at'] = entry['at'].isoformat()
    return out


class ValuationService:

    def __init__(self, valuation_repository, user_repository):
        self.repo      = valuation_repository
        self.user_repo = user_repository

    # ── Internal helpers ──────────────────────────────────────────────────

    def _get_valuation(self, valuation_id):
        try:
            v = self.repo.find_by_id(valuation_id)
        except Exception:
            return None
        return v

    def _history_entry(self, action, user_id, username, note=''):
        return {
            'action':   action,
            'by':       user_id,
            'by_name':  username,
            'at':       datetime.utcnow(),
            'note':     note or '',
        }

    # ── Transition ────────────────────────────────────────────────────────

    def transition(self, valuation_id, action, actor_id, actor_role, actor_name, note=''):
        """
        Apply an approval action. Returns (success, message, serialized_valuation).
        """
        rule = TRANSITIONS.get(action)
        if not rule:
            return False, 'Unknown action', None

        v = self._get_valuation(valuation_id)
        if not v:
            return False, 'Valuation not found', None

        current = v.get('approval_status', 'draft')

        if current not in rule['from']:
            return False, f"Cannot '{action}' from status '{current}'", None

        if actor_role not in rule['roles']:
            return False, 'You do not have permission for this action', None

        new_status = rule['to']
        extra = {}
        if action == 'submit':
            extra['submitted_by'] = actor_id
            extra['submitted_at'] = datetime.utcnow()
        elif action in ('approve_review', 'request_changes'):
            extra['reviewed_by'] = actor_id
            extra['reviewed_at'] = datetime.utcnow()
        elif action in ('approve_final', 'reject'):
            extra['approved_by'] = actor_id
            extra['approved_at'] = datetime.utcnow()

        entry = self._history_entry(action, actor_id, actor_name, note)
        self.repo.update_approval(valuation_id, new_status, entry, extra)

        updated = self._get_valuation(valuation_id)
        return True, f'Action {action} applied successfully', _serialize(updated)

    # ── Queue queries ─────────────────────────────────────────────────────

    def get_queue(self, actor_role, actor_id):
        """
        Return pending queue appropriate for the caller's role.
          reviewer → sees 'submitted'
          admin    → sees 'submitted' + 'reviewed'
          user     → sees their own non-draft valuations
        """
        if actor_role == 'admin':
            docs = self.repo.find_by_approval_status(['submitted', 'reviewed'])
        elif actor_role == 'reviewer':
            docs = self.repo.find_by_approval_status(['submitted'])
        else:
            # Engineers see all their own submitted/tracked valuations
            docs = self.repo.find_by_approval_status(
                ['submitted', 'changes_requested', 'reviewed', 'approved', 'rejected'],
                created_by=actor_id,
            )
        return [_serialize(d) for d in docs]

    def get_all_tracked(self, actor_role, actor_id):
        """All valuations with an approval_status (for the full history view)."""
        if actor_role == 'admin':
            docs = self.repo.find_all_with_approval()
        else:
            docs = self.repo.find_all_with_approval(created_by=actor_id)
        return [_serialize(d) for d in docs]
