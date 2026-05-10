"""
Document Service - Merges DB data into .docx templates using docxtpl.
"""
import os, io
from docxtpl import DocxTemplate

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'templates')

TEMPLATE_FILES = {
    'letterhead': 'letterhead_template.docx',
    'cover':      'cover_template.docx',
    'proposal':   'proposal_template.docx',
}


# ── Formatting helpers ─────────────────────────────────────────────────────────

def _v(value, fallback='—'):
    if value is None or value == '':
        return fallback
    return str(value)

def _money(value):
    if value is None:
        return '—'
    try:
        f = float(value)
        return f'{f:,.2f}'
    except (ValueError, TypeError):
        return '—'

def _yn(flag, yes_text='Yes', no_text='No'):
    if flag is True or str(flag).lower() in ('yes','true','1'):
        return yes_text
    return no_text

def _to_float(value, fallback=0.0):
    try:
        return float(value)
    except (ValueError, TypeError):
        return fallback


# ── Parties helpers ────────────────────────────────────────────────────────────

def _client_full_name(c):
    et = _v(c.get('entity_type'), 'individual')
    if et == 'company':
        return _v(c.get('first_name'), 'Unknown Company')
    title = _v(c.get('title'), '')
    name  = f'{c.get("first_name","") or ""} {c.get("last_name","") or ""}'.strip()
    return f'{title} {name}'.strip()

def _owner_full_name(o):
    title = _v(o.get('title'), '')
    return f'{title} {_v(o.get("owner_name",""), "")}'.strip()

def _party_address(ward, vdc, district, address):
    parts = [p for p in [
        ward and f'Ward No. {ward}',
        _v(vdc, ''),
        _v(district, ''),
    ] if p]
    if parts:
        return ', '.join(parts)
    return _v(address, '—')

def _owners_plain(owners):
    """E.g. 'Mr. A & Mrs. B'"""
    return ' & '.join(_owner_full_name(o) for o in owners) if owners else '—'

def _owners_block(owners):
    """Multi-line block for cover: Owner 1 / Owner 2 …"""
    lines = []
    for i, o in enumerate(owners, 1):
        name  = _owner_full_name(o)
        addr  = _party_address(o.get('ward_no'), o.get('vdc_municipality'),
                               o.get('district'), o.get('address'))
        dist  = _v(o.get('district'), '')
        lines.append(f'Owner {i}\n{name}\n{addr}\n{dist} District, Nepal\nContact No: {_v(o.get("phone") or o.get("mobile"),"—")}')
    return '\n\n'.join(lines)

def _owners_detail_block(owners):
    """Detailed block for Synopsis section."""
    blocks = []
    for i, o in enumerate(owners, 1):
        name = _owner_full_name(o)
        ward = _v(o.get('ward_no'), '—')
        vdc  = _v(o.get('vdc_municipality'), '—')
        dist = _v(o.get('district'), '—')
        cit  = _v(o.get('citizenship_no'), '—')
        cit_date   = _v(o.get('citizenship_issued_date'), '—')
        cit_office = _v(o.get('citizenship_issued_office'), '—')
        father     = _v(o.get('father_name'), '—')
        grand      = _v(o.get('grandfather_name') or o.get('husband_name'), '—')
        grand_label = "Husband's Name" if o.get('husband_name') else "Grand Father's Name"
        phone = _v(o.get('phone') or o.get('mobile'), '—')

        block = (
            f'Owner {i}          : {name}\n'
            f'Ward No.           : {ward}\n'
            f'Municipality/VDC   : {vdc}\n'
            f'District           : {dist}\n'
            f'Citizenship No.    : {cit}\n'
            f'Issued Date        : {cit_date}\n'
            f'Issued Office      : {cit_office}\n'
            f"Father's Name      : {father}\n"
            f'{grand_label:<19}: {grand}\n'
            f'Contact No.        : {phone}'
        )
        blocks.append(block)
    return '\n\n'.join(blocks)

def _client_entity_label(c):
    """Returns e.g. 'Individual (Male)' or 'Company'."""
    et = _v(c.get('entity_type'), 'individual').capitalize()
    if et.lower() == 'individual':
        gender = _v(c.get('gender'), '').capitalize()
        return f'Individual ({gender})' if gender else 'Individual'
    return et

def _client_detail_block(c):
    """Formatted block matching the owners_detail_block style."""
    name   = _client_full_name(c)
    ward   = _v(c.get('ward_no'), '—')
    vdc    = _v(c.get('vdc_municipality'), '—')
    dist   = _v(c.get('district'), '—')
    cit    = _v(c.get('citizenship_no'), '—')
    cit_date   = _v(c.get('citizenship_issued_date'), '—')
    cit_office = _v(c.get('citizenship_issued_office'), '—')
    father     = _v(c.get('father_name'), '—')
    grand      = _v(c.get('grandfather_name') or c.get('husband_name'), '—')
    grand_label = "Husband's Name" if c.get('husband_name') else "Grand Father's Name"
    phone  = _v(c.get('phone') or c.get('mobile'), '—')
    return (
        f'Client             : {name}\n'
        f'Ward No.           : {ward}\n'
        f'Municipality/VDC   : {vdc}\n'
        f'District           : {dist}\n'
        f'Citizenship No.    : {cit}\n'
        f'Issued Date        : {cit_date}\n'
        f'Issued Office      : {cit_office}\n'
        f"Father's Name      : {father}\n"
        f'{grand_label:<19}: {grand}\n'
        f'Contact No.        : {phone}'
    )

def _road_access(prop):
    field = _v(prop.get('road_access_field'), '')
    if field and field != '—':
        return field
    width = _v(prop.get('road_width'), '')
    rtype = _v(prop.get('road_type'), '')
    side  = _v(prop.get('road_side'), '')
    parts = [p for p in [width and f'{width}ft wide', rtype, side and f'at {side} Side'] if p]
    return ' '.join(parts) if parts else '—'

def _traditional(val, fallback='0'):
    """Split a traditional R-A-P-D string like '0-3-0-0' or use individual fields."""
    if isinstance(val, str) and '-' in val:
        parts = val.split('-')
        if len(parts) == 4:
            return parts
    return [fallback, fallback, fallback, fallback]

def _merit_lines(prop, val):
    """Generate importance bullet points from property data."""
    merits = []
    vdc  = _v(prop.get('vdc_municipality'), '')
    ward = _v(prop.get('ward_no'), '')
    loc  = f'{vdc}-{ward}' if ward else vdc
    if loc:
        merits.append(f'The considered site is located at {loc}.')
    road = _road_access(prop)
    if road and road != '—':
        merits.append(f'Access Road to the considered site is from {road}.')
    dist = _v(prop.get('public_transport_distance') or prop.get('nearest_landmark'), '')
    if dist:
        merits.append(f'Public Transportation: {dist}.')
    services = []
    for s, label in [('water_supply','Water Supply Line'),('sewerage','Sewerage Pipe Line'),
                     ('electricity_line','Electricity Line'),('telephone','Telephone Line'),
                     ('tv_cable','TV Cable')]:
        if _yn(prop.get(s)) == 'Yes':
            services.append(label)
    if services:
        merits.append(f'Physical infrastructure services such as {", ".join(services)} are available.')
    bank = _v(val.get('bank_name') if val else None, '')
    if bank and prop.get('nearest_landmark'):
        merits.append(f'Approx. {_v(prop.get("public_transport_distance"),"—")} from {prop.get("nearest_landmark","the bank")}.')
    # Pad to 5
    while len(merits) < 5:
        merits.append('—')
    return merits[:5]


# ── Main context builder ───────────────────────────────────────────────────────

def build_context(hierarchy, valuation):
    account    = hierarchy.get('account', {})
    clients    = hierarchy.get('clients', [])
    owners     = hierarchy.get('owners', [])
    properties = hierarchy.get('properties', [])
    prop       = properties[0] if properties else {}
    val        = valuation or {}

    # Firm info – prefer valuation metadata, fall back to account
    firm_name    = _v(val.get('firm_name'),    account.get('account_name', ''))
    firm_address = _v(val.get('firm_address'), account.get('address', ''))
    firm_phone   = _v(val.get('firm_phone'),   account.get('phone', ''))
    firm_email   = _v(val.get('firm_email'),   account.get('email', ''))

    # First client
    c = clients[0] if clients else {}
    client_name   = _client_full_name(c) if c else '—'
    c_ward   = _v(c.get('ward_no'), '')
    c_vdc    = _v(c.get('vdc_municipality'), '')
    c_dist   = _v(c.get('district'), '')
    client_address_line = f'Ward No. {c_ward}' if c_ward else _v(c.get('address'), '—')
    client_address_full = _party_address(c.get('ward_no'), c.get('vdc_municipality'),
                                         c.get('district'), c.get('address'))
    client_district_country = f'{c_dist} District, Nepal' if c_dist else _v(c.get('country'), '')

    # Property location string
    p_ward      = _v(prop.get('ward_no'), '')
    p_vdc       = _v(prop.get('vdc_municipality'), '')
    p_dist      = _v(prop.get('district'), '')
    sabik_vdc   = _v(prop.get('sabik_vdc'), '')
    sabik_ward  = _v(prop.get('sabik_ward_no'), '')
    # Build sabik string: prefer separate fields, fall back to legacy combined `sabik`
    if sabik_vdc or sabik_ward:
        sabik_str = f'{sabik_vdc}-{sabik_ward}' if sabik_vdc and sabik_ward else (sabik_vdc or sabik_ward)
    else:
        sabik_str = _v(prop.get('sabik'), '')
    present_part = f'{p_vdc}-{p_ward}' if p_ward else p_vdc
    prop_loc_parts = [p for p in [present_part, sabik_str and f'(Sabik {sabik_str})', p_dist and f'{p_dist} District'] if p]
    property_location_full = ', '.join(prop_loc_parts) or _v(prop.get('address'), '—')

    # Land area traditional
    lorc_parts   = _traditional(prop.get('land_area_lorc_trad'))
    meas_parts   = _traditional(prop.get('land_area_meas_trad'))
    deduct_parts = ['0','0','0','0']  # deduction not always tracked separately
    consid_parts = meas_parts  # considered = measured (after deduction)

    # Influencing factors
    bool_fields = {
        'near_army_barracks':    'near_army_barracks_text',
        'near_cremation_area':   'near_cremation_area_text',
        'near_dumping_site':     'near_dumping_site_text',
        'near_fuel_depot':       'near_fuel_depot_text',
        'near_hazardous_factory':'near_hazardous_factory_text',
        'near_high_tension_line':'near_high_tension_line_text',
        'near_monument':         'near_monument_text',
        'near_river_stream':     'near_river_stream_text',
        'near_temple':           'near_temple_text',
        'water_logging':         'water_logging_text',
    }

    merits = _merit_lines(prop, val)

    # Importance text
    bank_name = _v(val.get('bank_name'), '—')
    land_use  = _v(prop.get('notes') or prop.get('address'), 'residential purposes')
    importance_text = (
        f'The Property is located at {property_location_full}. '
        f'The site can be accessed from {bank_name} and travelling around '
        f'{_v(prop.get("public_transport_distance") or prop.get("nearest_landmark"), "the area")}.'
    )
    accessibility_text = (
        f'The said site is linked via {_road_access(prop)}. '
        f'The site can be accessed from {bank_name} and travelling around '
        f'{_v(prop.get("public_transport_distance") or prop.get("nearest_landmark"), "the area")}, '
        f'We can reach this Property.'
    )

    # Land area in sq.ft (1 sqm = 10.7639 sqft)
    lorc_sqft = round(_to_float(prop.get('land_area_lorc') or 0) * 10.7639, 2)
    meas_sqft = round(_to_float(prop.get('land_area_measured') or 0) * 10.7639, 2)

    # Did area decrease from LORC to measurement?
    lorc_num = _to_float(prop.get('land_area_measured') or 0)
    meas_num = _to_float(prop.get('land_area_lorc') or 0)
    area_change = 'Decreased' if lorc_num < meas_num else 'Increased'

    summary_remarks_lines = [merits[i] for i in range(min(5, len(merits))) if merits[i] != '—']
    summary_remarks = '\n'.join(summary_remarks_lines) if summary_remarks_lines else '—'

    # FMV/Distress
    fmv_land     = _money(prop.get('fair_market_value_land'))
    fmv_building = _money(prop.get('fair_market_value_building'))
    fmv_total    = _money(prop.get('fair_market_value_total'))
    dv_total     = _money(prop.get('distress_value_total'))

    # Avg FMV rate per Aana
    govt_rate = _to_float(prop.get('government_rate_per_aana') or 0)
    comm_rate = _to_float(prop.get('commercial_rate_per_aana') or 0)
    avg_rate  = (govt_rate + comm_rate) / 2
    avg_fmv_rate = _money(avg_rate) if avg_rate else '—'
    try:
        land_aana = _v(prop.get('land_area_lorc_trad', '').split('-')[1] if prop.get('land_area_lorc_trad') else '', '—')
    except Exception:
        land_aana = '—'

    lorc_area_num = _to_float(prop.get('land_area_lorc') or 0)
    govt_land_value   = _money(govt_rate * lorc_area_num / 508.72) if lorc_area_num else '—'
    market_land_value = _money(comm_rate * lorc_area_num / 508.72) if lorc_area_num else '—'

    ctx = {
        # Firm
        'firm_name':    firm_name,
        'firm_address': firm_address,
        'firm_phone':   firm_phone,
        'firm_email':   firm_email,

        # Report metadata
        'ref_no':       _v(val.get('ref_no'), '—'),
        'fiscal_year':  _v(val.get('fiscal_year'), '—'),
        'cert_date':    _v(val.get('certification_date'), '—'),
        'inspection_date': _v(val.get('inspection_date'), '—'),
        'valuation_date':  _v(val.get('certification_date'), '—'),

        # Bank
        'bank_name':    bank_name,
        'bank_branch':  _v(val.get('bank_branch'), '—'),
        'bank_address': _v(val.get('bank_address'), '—'),

        # Client (first client)
        'client_entity_type_label':    _client_entity_label(c) if c else '—',
        'client_entity_type':          _v(c.get('entity_type'), 'individual'),
        'client_gender':               _v(c.get('gender'), '—'),
        'client_full_name':            client_name,
        'client_address_line':         client_address_line,
        'client_address_full':         client_address_full,
        'client_district_country':     client_district_country,
        'client_phone':                _v(c.get('phone') or c.get('mobile'), '—'),
        'client_ward_no':              _v(c.get('ward_no'), '—'),
        'client_vdc_municipality':     _v(c.get('vdc_municipality'), '—'),
        'client_district':             _v(c.get('district'), '—'),
        'client_citizenship_no':       _v(c.get('citizenship_no'), '—'),
        'client_citizenship_issued_date':   _v(c.get('citizenship_issued_date'), '—'),
        'client_citizenship_issued_office': _v(c.get('citizenship_issued_office'), '—'),
        'client_father_name':          _v(c.get('father_name'), '—'),
        'client_grandfather_name':     _v(c.get('grandfather_name') or c.get('husband_name'), '—'),
        'client_husband_name':         _v(c.get('husband_name'), '—'),
        'client_pan_no':               _v(c.get('pan_no'), '—'),
        'client_detail_block':         _client_detail_block(c) if c else '—',

        # Owners
        'owners_plain':        _owners_plain(owners),
        'owners_block':        _owners_block(owners),
        'owners_detail_block': _owners_detail_block(owners),
        'owner1_name':         _owner_full_name(owners[0]) if owners else '—',
        'owner2_name':         _owner_full_name(owners[1]) if len(owners) > 1 else '—',

        # Property
        'plot_no':               _v(prop.get('plot_no'), '—'),
        'property_location_full': property_location_full,
        'property_address':      _v(prop.get('address'), '—'),
        'property_ward_no':      p_ward or '—',
        'vdc_municipality':      p_vdc or '—',
        'district':              p_dist or '—',
        'sabik_vdc':             sabik_vdc or '—',
        'sabik_ward_no':         sabik_ward or '—',
        'sabik':                 sabik_str,
        'property_mortgaged':    _v(prop.get('property_mortgaged'), 'Land'),
        'gps_coordinates':       _v(prop.get('gps_coordinates'), '—'),
        'sheet_no':              _v(prop.get('sheet_no'), '—'),
        'location_type':         _v(prop.get('property_type'), 'Residential'),
        'land_shape':            _v(prop.get('land_shape'), '—'),
        'nearest_market':        _v(prop.get('nearest_market'), '—'),
        'distance_from_road':    _v(prop.get('nearest_landmark') or prop.get('public_transport_distance'), '—'),
        'frontage':              _v(prop.get('frontage'), '—'),

        # Land area
        'land_area_lorc':      _v(prop.get('land_area_lorc'), '—'),
        'land_area_measured':  _v(prop.get('land_area_measured'), '—'),
        'land_area_deducted':  _v(prop.get('land_area_measured'), '—'),
        'land_area_considered': _v(prop.get('land_area_measured'), '—'),
        'land_area_aana':      land_aana,

        # Traditional R-A-P-D
        'lorc_r': lorc_parts[0], 'lorc_a': lorc_parts[1],
        'lorc_p': lorc_parts[2], 'lorc_d': lorc_parts[3],
        'meas_r': meas_parts[0], 'meas_a': meas_parts[1],
        'meas_p': meas_parts[2], 'meas_d': meas_parts[3],
        'deduct_r': deduct_parts[0], 'deduct_a': deduct_parts[1],
        'deduct_p': deduct_parts[2], 'deduct_d': deduct_parts[3],
        'consid_r': consid_parts[0], 'consid_a': consid_parts[1],
        'consid_p': consid_parts[2], 'consid_d': consid_parts[3],

        # Boundaries
        'north_boundary': _v(prop.get('north_boundary'), '—'),
        'south_boundary': _v(prop.get('south_boundary'), '—'),
        'east_boundary':  _v(prop.get('east_boundary'), '—'),
        'west_boundary':  _v(prop.get('west_boundary'), '—'),
        'boundary_certified_by':  _v(prop.get('legal_reference_no'), '—'),
        'boundary_cert_date':     _v(prop.get('lorc_registration_date'), '—'),

        # Infrastructure
        'motorable_access': _yn(prop.get('motorable_access')),
        'water_supply':     _yn(prop.get('water_supply')),
        'electricity_line': _yn(prop.get('electricity_line')),
        'telephone':        _yn(prop.get('telephone')),
        'tv_cable':         _yn(prop.get('tv_cable')),
        'sewerage':         _yn(prop.get('sewerage')),

        # Influence flags
        **{v: _yn(prop.get(k)) for k, v in bool_fields.items()},

        # Road & access detail
        'road_access':           _road_access(prop),
        'road_access_blueprint': _v(prop.get('road_access_blueprint'), '—'),
        'land_topography':       _v(prop.get('land_topography'), '—'),
        'facing':                _v(prop.get('facing'), '—'),
        'public_transport_distance': _v(prop.get('public_transport_distance'), '—'),
        'tole':                  _v(prop.get('tole'), '—'),
        'accessibility_text':    accessibility_text,
        'area_change':           area_change,
        'land_area_lorc_sqft':   str(lorc_sqft) if lorc_sqft else '—',
        'land_area_meas_sqft':   str(meas_sqft) if meas_sqft else '—',

        # Rates
        'commercial_rate': _money(prop.get('commercial_rate_per_aana')),
        'government_rate': _money(prop.get('government_rate_per_aana')),
        'avg_fmv_rate':    avg_fmv_rate,
        'govt_land_value': govt_land_value,
        'market_land_value': market_land_value,

        # Valuation
        'fair_market_value':          fmv_total,
        'fair_market_value_land':     fmv_land,
        'fair_market_value_building': fmv_building,
        'distress_value':             dv_total,
        'dv_land':    _money(prop.get('distress_value_land')),
        'dv_building': _money(prop.get('distress_value_building')),
        'valuation_in_words': _v(prop.get('valuation_in_words'), '—'),

        # Legal
        'ownership_type':          _v(prop.get('ownership_type'), '—'),
        'hold_type':               _v(prop.get('hold_type'), '—'),
        'mode_of_acquisition':     _v(prop.get('mode_of_acquisition'), '—'),
        'lorc_registration_date':  _v(prop.get('lorc_registration_date'), '—'),
        'land_revenue_payment_date': _v(prop.get('land_revenue_payment_date'), '—'),

        # Importance
        'location_importance_text': importance_text,
        'merit_1': merits[0], 'merit_2': merits[1], 'merit_3': merits[2],
        'merit_4': merits[3], 'merit_5': merits[4],
        'property_description': _v(prop.get('notes'), '—'),
        'summary_remarks':      summary_remarks,

        # Commercial importance
        'proximity_civic_amenities': _v(prop.get('nearest_market'), 'The property is near civic amenities.'),
        'surface_transportation':    'All types of surface transportation can access the property.',
        'land_use':                  f'The land is used for {_v(prop.get("property_type","residential"))} purpose.',
        'value_increase_features':   _v(prop.get('notes'), 'The property lies in a good location.'),
        'value_decrease_features':   'The Property has no such features.' if not any([
            prop.get('near_army_barracks'), prop.get('near_dumping_site'),
            prop.get('near_hazardous_factory'), prop.get('water_logging')]) else '—',
        'other_facilities':          'Most kinds of civic amenities are available.',
        'commercial_remarks':        _v(prop.get('notes'), 'N/A.'),

        # Certifier
        'certifier_name':   _v(val.get('certifier_name'), '—'),
        'nec_no':           _v(val.get('nec_no'), '—'),
        'nec_class':        _v(val.get('nec_class'), 'A'),
        'site_visited_by':  _v(val.get('site_visited_by'), _v(val.get('certifier_name'), '—')),
        'site_visitor_phone': _v(val.get('site_visitor_phone'), firm_phone),

        # Remarks
        'remarks': _v(val.get('remarks') or prop.get('notes'), '—'),
    }
    return ctx


class DocumentService:

    def generate(self, doc_type, hierarchy, valuation):
        template_file = TEMPLATE_FILES.get(doc_type)
        if not template_file:
            raise ValueError(f'Unknown document type: {doc_type}')
        template_path = os.path.join(TEMPLATES_DIR, template_file)
        if not os.path.exists(template_path):
            raise FileNotFoundError(f'Template not found: {template_path}')
        tpl = DocxTemplate(template_path)
        context = build_context(hierarchy, valuation)
        tpl.render(context)
        buf = io.BytesIO()
        tpl.save(buf)
        buf.seek(0)
        return buf.read()
