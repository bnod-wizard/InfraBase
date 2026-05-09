"""
Template Service - Business logic for versioned template configuration.
"""
import uuid
from datetime import datetime, timezone
from models.template_model import TemplateModel, DEFAULTS


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _to_json(t):
    return TemplateModel.to_json(dict(t))


class TemplateService:

    def __init__(self, template_repository):
        self.repo = template_repository
        self.repo.seed_defaults(DEFAULTS)

    # ── Queries ───────────────────────────────────────────────────────────────

    def get_all(self):
        templates = self.repo.find_all()
        result = []
        for t in templates:
            d = _to_json(t)
            # Include only the active version's sections (list stays lean)
            active_v = d.get('active_version', 1)
            active = next((v for v in d.get('versions', []) if v['version'] == active_v), None)
            d['active_sections'] = active['sections'] if active else []
            d['version_count'] = len(d.get('versions', []))
            result.append(d)
        return result

    def get_by_id(self, template_id):
        t = self.repo.find_by_id(template_id)
        if not t:
            return None
        return _to_json(t)

    # ── Version management ────────────────────────────────────────────────────

    def save_version(self, template_id, sections, label=None):
        t = self.repo.find_by_id(template_id)
        if not t:
            return None, 'Template not found'
        if not isinstance(sections, list):
            return None, 'sections must be a list'

        versions = t.get('versions', [])
        next_num = max((v['version'] for v in versions), default=0) + 1
        auto_label = label or datetime.now(timezone.utc).strftime('%-d %b %Y')

        version_obj = {
            'version': next_num,
            'label': auto_label,
            'sections': sections,
            'created_at': _now_iso(),
        }
        self.repo.push_version(template_id, version_obj)
        return _to_json(self.repo.find_by_id(template_id)), None

    def set_active(self, template_id, version_num):
        t = self.repo.find_by_id(template_id)
        if not t:
            return None, 'Template not found'
        versions = t.get('versions', [])
        if not any(v['version'] == version_num for v in versions):
            return None, f'Version {version_num} does not exist'
        self.repo.set_active_version(template_id, version_num)
        return _to_json(self.repo.find_by_id(template_id)), None

    # ── Custom templates ──────────────────────────────────────────────────────

    def create_custom(self, name, description, icon, initial_sections=None):
        if not name or not name.strip():
            return None, 'name is required'
        tid = 'custom_' + uuid.uuid4().hex[:10]
        sections = initial_sections or [
            {'id': 'main_content', 'label': 'Main Content', 'content': ''}
        ]
        doc = {
            'template_id': tid,
            'name': name.strip(),
            'description': (description or '').strip(),
            'icon': icon or '⎙',
            'is_custom': True,
            'active_version': 1,
            'versions': [{
                'version': 1,
                'label': 'Default',
                'sections': sections,
                'created_at': _now_iso(),
            }],
            'updated_at': datetime.now(timezone.utc),
        }
        result = self.repo.insert_custom(doc)
        return _to_json(result), None

    def delete_custom(self, template_id):
        ok = self.repo.delete_custom(template_id)
        return ok, None if ok else 'Not found or not a custom template'
