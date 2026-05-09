"""
Template Model - Configurable text sections for document templates, with version history.

Structure per template document:
  template_id, name, description, icon, is_custom, active_version, versions[], updated_at

Each version: { version: int, label: str, sections: [...], created_at: str }
Version 1 is always the seeded default and is never overwritten.
"""
from datetime import datetime, timezone


def _now():
    return datetime.now(timezone.utc).isoformat()


class TemplateModel:

    @staticmethod
    def to_json(data):
        d = dict(data)
        if '_id' in d:
            d['_id'] = str(d['_id'])
        if 'updated_at' in d:
            u = d['updated_at']
            d['updated_at'] = u.isoformat() if hasattr(u, 'isoformat') else u
        return d


# ── Default sections per template ────────────────────────────────────────────

_COVER_SECTIONS = [
    {
        'id': 'report_title',
        'label': 'Report Title',
        'content': 'PROPERTY VALUATION REPORT',
    },
    {
        'id': 'report_subtitle',
        'label': 'Report Subtitle',
        'content': 'Prepared for {{bank_name}}, {{bank_branch}}',
    },
    {
        'id': 'prepared_by_line',
        'label': 'Prepared By Line',
        'content': 'Prepared By: {{firm_name}}\n{{firm_address}}\nPhone: {{firm_phone}}',
    },
    {
        'id': 'cover_footer',
        'label': 'Footer Note',
        'content': 'This report is confidential and intended solely for the use of {{bank_name}}.',
    },
]

_LETTERHEAD_SECTIONS = [
    {
        'id': 'firm_tagline',
        'label': 'Firm Tagline',
        'content': 'Professional Property Valuation Services',
    },
    {
        'id': 'declaration',
        'label': 'Certification Declaration',
        'content': (
            'We hereby certify that we have personally inspected the above-mentioned property '
            'situated at {{property_location_full}} and the valuation has been done as per '
            'Nepal Rastra Bank directives and prevailing market rates.'
        ),
    },
    {
        'id': 'certifier_statement',
        'label': 'Certifier Statement',
        'content': (
            'Certified by: {{certifier_name}}\n'
            'NEC No: {{nec_no}}\n'
            '{{firm_name}}, {{firm_address}}'
        ),
    },
    {
        'id': 'letterhead_footer',
        'label': 'Footer Text',
        'content': 'Tel: {{firm_phone}} | Email: {{firm_email}}',
    },
]

_PROPOSAL_SECTIONS = [
    {
        'id': 'declaration',
        'label': 'Certification Declaration',
        'content': (
            'We hereby certify that we have personally visited and inspected the property '
            'mentioned herein, belonging to {{owners_plain}}, situated at '
            '{{property_location_full}}, and have determined the Fair Market Value as of '
            '{{inspection_date}}, in accordance with the guidelines set forth by Nepal '
            'Rastra Bank and current market conditions.'
        ),
    },
    {
        'id': 'scope_note',
        'label': 'Scope of Work',
        'content': (
            'This valuation has been prepared for mortgage/loan purposes for {{bank_name}}, '
            '{{bank_branch}}. The value represents the Fair Market Value assuming the property '
            'is free from all encumbrances.'
        ),
    },
    {
        'id': 'methodology',
        'label': 'Valuation Methodology',
        'content': (
            'The valuation has been carried out using the Comparative Sales Method for land '
            'and the Depreciated Replacement Cost Method for structures, cross-checked '
            'against the prevailing government rates for the locality.'
        ),
    },
    {
        'id': 'disclaimer',
        'label': 'Legal Disclaimer',
        'content': (
            'This report is prepared solely for the use of {{bank_name}} and should not be '
            'relied upon by any third party. The valuers accept no responsibility for any '
            'losses arising from use of this report by unauthorized parties. The values '
            'stated herein are valid for a period of six months from the date of certification.'
        ),
    },
    {
        'id': 'remarks_default',
        'label': 'Default Remarks',
        'content': (
            'The property is physically accessible and the title documents appear to be in '
            'order as presented. Further legal due diligence is recommended before disbursement.'
        ),
    },
]


def _make_default(template_id, name, description, icon, sections):
    return {
        'template_id': template_id,
        'name': name,
        'description': description,
        'icon': icon,
        'is_custom': False,
        'active_version': 1,
        'versions': [
            {
                'version': 1,
                'label': 'Default',
                'sections': sections,
                'created_at': _now(),
            }
        ],
        'updated_at': datetime.now(timezone.utc),
    }


DEFAULTS = {
    'cover': _make_default(
        'cover', 'Cover Page',
        'Title cover sheet for valuation reports',
        '⊡', _COVER_SECTIONS,
    ),
    'letterhead': _make_default(
        'letterhead', 'Letterhead',
        'Official letterhead for correspondence and reports',
        '▤', _LETTERHEAD_SECTIONS,
    ),
    'proposal': _make_default(
        'proposal', 'Full Proposal',
        'Complete property valuation report with all sections',
        '▥', _PROPOSAL_SECTIONS,
    ),
}
