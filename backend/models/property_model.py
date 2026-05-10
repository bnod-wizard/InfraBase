"""
Property Model - Physical asset/property
"""
from datetime import datetime
from bson import ObjectId


def _to_oid(val):
    if val is None: return None
    if isinstance(val, ObjectId): return val
    try: return ObjectId(str(val))
    except Exception: return None


class PropertyModel:
    """Property Model - Physical asset/property"""
    
    @staticmethod
    def _safe_iso(value):
        return value.isoformat() if hasattr(value, 'isoformat') else value

    @staticmethod
    def to_dict(property_data):
        """Convert property data to dictionary for database storage"""
        return {
            'account_id': _to_oid(property_data.get('account_id')),
            'client_id':  _to_oid(property_data.get('client_id')),
            'owner_id':   _to_oid(property_data.get('owner_id')),
            'property_name': property_data.get('property_name'),
            'property_type': property_data.get('property_type'),
            'property_mortgaged': property_data.get('property_mortgaged', 'Both'),  # Land, Building, Both
            'property_status': property_data.get('property_status'),

            # Location
            'address': property_data.get('address'),
            'tole': property_data.get('tole'),  # Locality/Tole
            'ward_no': property_data.get('ward_no'),
            'vdc_municipality': property_data.get('vdc_municipality'),
            'district': property_data.get('district'),
            'city': property_data.get('city'),
            'state': property_data.get('state'),
            'zip_code': property_data.get('zip_code'),
            'country': property_data.get('country'),
            'gps_coordinates': property_data.get('gps_coordinates'),
            'sheet_no': property_data.get('sheet_no'),  # Survey map sheet number
            'sabik': property_data.get('sabik'),          # Legacy combined sabik string (kept for compat)
            'sabik_vdc': property_data.get('sabik_vdc'),  # Old/sabik VDC name e.g. "Jorpati VDC"
            'sabik_ward_no': property_data.get('sabik_ward_no'),  # Old/sabik ward number e.g. "04"
            'plot_no': property_data.get('plot_no'),
            'latitude': property_data.get('latitude'),
            'longitude': property_data.get('longitude'),

            # Land details
            'land_area_lorc': property_data.get('land_area_lorc'),            # As per LORC (Sq.M)
            'land_area_lorc_trad': property_data.get('land_area_lorc_trad'),   # e.g. 0-3-0-0
            'land_area_measured': property_data.get('land_area_measured'),     # As measured (Sq.M)
            'land_area_meas_trad': property_data.get('land_area_meas_trad'),   # e.g. 0-2-3-3.20
            'land_area_deducted': property_data.get('land_area_deducted'),     # After deduction (Sq.M)
            'land_area_ded_trad': property_data.get('land_area_ded_trad'),     # e.g. 0-2-2-0.76
            'considered_area': property_data.get('considered_area'),           # Area considered (Sq.M)
            'land_area': property_data.get('land_area'),
            'area_unit': property_data.get('area_unit', 'sqm'),
            'land_shape': property_data.get('land_shape'),
            'land_topography': property_data.get('land_topography'),
            'land_level': property_data.get('land_level', ''),          # Level / general terrain
            'nature_of_soil': property_data.get('nature_of_soil', ''), # Nature of soil
            'construction_on_land': property_data.get('construction_on_land', ''),  # Any construction
            'positive_features': property_data.get('positive_features', ''), # Positive feature of land
            'negative_features': property_data.get('negative_features', ''), # Negative feature of area
            'frontage': property_data.get('frontage'),
            'water_facility': property_data.get('water_facility'),
            # Field survey triangle measurements — Land Area (Table 23)
            'lm_tri_a_a': property_data.get('lm_tri_a_a', ''), 'lm_tri_a_b': property_data.get('lm_tri_a_b', ''),
            'lm_tri_a_c': property_data.get('lm_tri_a_c', ''), 'lm_tri_a_s': property_data.get('lm_tri_a_s', ''),
            'lm_tri_a_sqft': property_data.get('lm_tri_a_sqft', ''), 'lm_tri_a_aana': property_data.get('lm_tri_a_aana', ''),
            'lm_tri_b_a': property_data.get('lm_tri_b_a', ''), 'lm_tri_b_b': property_data.get('lm_tri_b_b', ''),
            'lm_tri_b_c': property_data.get('lm_tri_b_c', ''), 'lm_tri_b_s': property_data.get('lm_tri_b_s', ''),
            'lm_tri_b_sqft': property_data.get('lm_tri_b_sqft', ''), 'lm_tri_b_aana': property_data.get('lm_tri_b_aana', ''),
            # Field survey triangle measurements — Road Deduction (Table 24)
            'ded_tri_a_a': property_data.get('ded_tri_a_a', ''), 'ded_tri_a_b': property_data.get('ded_tri_a_b', ''),
            'ded_tri_a_c': property_data.get('ded_tri_a_c', ''), 'ded_tri_a_s': property_data.get('ded_tri_a_s', ''),
            'ded_tri_a_sqft': property_data.get('ded_tri_a_sqft', ''), 'ded_tri_a_aana': property_data.get('ded_tri_a_aana', ''),
            'ded_tri_b_a': property_data.get('ded_tri_b_a', ''), 'ded_tri_b_b': property_data.get('ded_tri_b_b', ''),
            'ded_tri_b_c': property_data.get('ded_tri_b_c', ''), 'ded_tri_b_s': property_data.get('ded_tri_b_s', ''),
            'ded_tri_b_sqft': property_data.get('ded_tri_b_sqft', ''), 'ded_tri_b_aana': property_data.get('ded_tri_b_aana', ''),

            # Boundaries
            'north_boundary': property_data.get('north_boundary'),
            'south_boundary': property_data.get('south_boundary'),
            'east_boundary': property_data.get('east_boundary'),
            'west_boundary': property_data.get('west_boundary'),

            # Building details
            'building_label': property_data.get('building_label'),
            'structural_system': property_data.get('structural_system'),
            'building_age': property_data.get('building_age'),
            'building_life': property_data.get('building_life'),
            'total_area': property_data.get('total_area'),
            'built_area': property_data.get('built_area'),
            'approved_area': property_data.get('approved_area'),
            'considered_area': property_data.get('considered_area'),
            'carpet_area': property_data.get('carpet_area'),
            'floor_details': property_data.get('floor_details', []),  # [{floor, area, use}]
            'number_of_units': property_data.get('number_of_units'),
            'bedrooms': property_data.get('bedrooms'),
            'bathrooms': property_data.get('bathrooms'),
            'parking_spaces': property_data.get('parking_spaces'),
            'construction_year': property_data.get('construction_year'),
            'property_age': property_data.get('property_age'),
            'facing': property_data.get('facing'),
            'furnishing': property_data.get('furnishing'),

            # Infrastructure & Services
            'motorable_access': property_data.get('motorable_access'),
            'road_access_blueprint': property_data.get('road_access_blueprint'),
            'road_access_field': property_data.get('road_access_field'),
            'road_width': property_data.get('road_width'),
            'road_type': property_data.get('road_type'),  # Earthen, Gravel, Concrete, Asphalt
            'road_side': property_data.get('road_side'),  # North, South, East, West
            'electricity_line': property_data.get('electricity_line'),
            'water_supply': property_data.get('water_supply'),
            'sewerage': property_data.get('sewerage'),
            'tv_cable': property_data.get('tv_cable'),
            'telephone': property_data.get('telephone'),
            'public_transport_distance': property_data.get('public_transport_distance'),
            'nearest_landmark': property_data.get('nearest_landmark'),
            'landmark_coordinates': property_data.get('landmark_coordinates'),
            'nearest_market': property_data.get('nearest_market'),

            # Valuation
            'commercial_rate_per_aana': property_data.get('commercial_rate_per_aana'),
            'government_rate_per_aana': property_data.get('government_rate_per_aana'),
            'fair_market_value_land': property_data.get('fair_market_value_land'),
            'fair_market_value_building': property_data.get('fair_market_value_building'),
            'fair_market_value_total': property_data.get('fair_market_value_total'),
            'market_value_land': property_data.get('market_value_land'),
            'market_value_building': property_data.get('market_value_building'),
            'govt_value_remarks': property_data.get('govt_value_remarks', ''),
            'market_value_remarks': property_data.get('market_value_remarks', 'As from Local People and the judgement of the valuator'),
            'land_area_aana_decimal': property_data.get('land_area_aana_decimal'),
            'summary_remarks': property_data.get('summary_remarks', ''),
            'distress_value_land': property_data.get('distress_value_land'),
            'distress_value_building': property_data.get('distress_value_building'),
            'distress_value_total': property_data.get('distress_value_total'),
            'gross_building_value': property_data.get('gross_building_value'),
            'depreciation_rate': property_data.get('depreciation_rate'),
            'net_building_value': property_data.get('net_building_value'),
            'valuation_in_words': property_data.get('valuation_in_words'),
            'purchase_price': property_data.get('purchase_price'),
            'estimated_value': property_data.get('estimated_value'),
            'rental_value': property_data.get('rental_value'),
            'currency': property_data.get('currency', 'NPR'),

            # Legal
            'survey_number': property_data.get('survey_number'),
            'property_id_number': property_data.get('property_id_number'),
            'ownership_type': property_data.get('ownership_type'),
            'hold_type': property_data.get('hold_type'),
            'mode_of_acquisition': property_data.get('mode_of_acquisition'),
            'lorc_registration_date': property_data.get('lorc_registration_date'),
            'land_revenue_payment_date': property_data.get('land_revenue_payment_date'),
            'gov_ratio': property_data.get('gov_ratio'),
            'legal_reference_no': property_data.get('legal_reference_no'),
            # Legal checklist — Land Revenue
            'land_revenue_paid':      property_data.get('land_revenue_paid', True),
            # Legal checklist — Land Registration
            'sale_gift_elapsed':      property_data.get('sale_gift_elapsed', True),
            # Legal checklist — Maps / Survey
            'maps_plots_indicated':   property_data.get('maps_plots_indicated', True),
            'maps_access_marked':     property_data.get('maps_access_marked', True),
            'maps_shape_tallies':     property_data.get('maps_shape_tallies', True),
            # Legal checklist — Boundary Certificate
            'boundary_cert_available': property_data.get('boundary_cert_available', True),
            'boundary_cert_date':      property_data.get('boundary_cert_date', ''),
            # Legal checklist — General
            'free_access_available':   property_data.get('free_access_available', True),
            'acquisition_notice':      property_data.get('acquisition_notice', False),
            'boundary_clearly_defined': property_data.get('boundary_clearly_defined', True),
            # Comments per legal sub-section (default: None)
            'ownership_comments':          property_data.get('ownership_comments', 'None'),
            'land_revenue_comments':       property_data.get('land_revenue_comments', 'None'),
            'land_registration_comments':  property_data.get('land_registration_comments', 'None'),
            'maps_comments':               property_data.get('maps_comments', 'None'),
            'area_change_comments':        property_data.get('area_change_comments', 'None'),
            'boundary_cert_comments':      property_data.get('boundary_cert_comments', 'None'),
            'general_legal_comments':      property_data.get('general_legal_comments', 'None'),

            # Influencing factors
            'near_army_barracks': property_data.get('near_army_barracks', False),
            'near_cremation_area': property_data.get('near_cremation_area', False),
            'near_dumping_site': property_data.get('near_dumping_site', False),
            'near_fuel_depot': property_data.get('near_fuel_depot', False),
            'near_hazardous_factory': property_data.get('near_hazardous_factory', False),
            'near_high_tension_line': property_data.get('near_high_tension_line', False),
            'near_monument': property_data.get('near_monument', False),
            'near_river_stream': property_data.get('near_river_stream', False),
            'near_temple': property_data.get('near_temple', False),
            'water_logging': property_data.get('water_logging', False),

            'amenities': property_data.get('amenities', []),
            'landmark': property_data.get('landmark'),
            'documents': property_data.get('documents', []),
            'photos': property_data.get('photos', []),
            'notes': property_data.get('notes'),
            'status': property_data.get('status', 'active'),
            'created_by': property_data.get('created_by'),
            'created_at': property_data.get('created_at', datetime.utcnow()),
            'updated_at': datetime.utcnow()
        }

    @staticmethod
    def to_json(property_data):
        """Convert property data to JSON for API response"""
        if '_id' in property_data:
            property_data['_id'] = str(property_data['_id'])
        if 'account_id' in property_data:
            property_data['account_id'] = str(property_data['account_id'])
        if 'client_id' in property_data:
            property_data['client_id'] = str(property_data['client_id'])
        if 'owner_id' in property_data:
            property_data['owner_id'] = str(property_data['owner_id'])
        if 'created_at' in property_data:
            property_data['created_at'] = PropertyModel._safe_iso(property_data['created_at'])
        if 'updated_at' in property_data:
            property_data['updated_at'] = PropertyModel._safe_iso(property_data['updated_at'])
        return property_data

    @staticmethod
    def from_dict(data):
        """Create property object from database data"""
        return {
            '_id': data.get('_id'),
            'account_id': data.get('account_id'),
            'client_id': data.get('client_id'),
            'owner_id': data.get('owner_id'),
            'property_name': data.get('property_name'),
            'property_type': data.get('property_type'),
            'property_mortgaged': data.get('property_mortgaged'),
            'property_status': data.get('property_status'),
            # Location
            'address': data.get('address'),
            'tole': data.get('tole'),
            'ward_no': data.get('ward_no'),
            'vdc_municipality': data.get('vdc_municipality'),
            'district': data.get('district'),
            'city': data.get('city'),
            'state': data.get('state'),
            'zip_code': data.get('zip_code'),
            'country': data.get('country'),
            'gps_coordinates': data.get('gps_coordinates'),
            'sheet_no': data.get('sheet_no'),
            'sabik': data.get('sabik'),
            'sabik_vdc': data.get('sabik_vdc'),
            'sabik_ward_no': data.get('sabik_ward_no'),
            'plot_no': data.get('plot_no'),
            'latitude': data.get('latitude'),
            'longitude': data.get('longitude'),
            # Land
            'land_area_lorc': data.get('land_area_lorc'),
            'land_area_lorc_trad': data.get('land_area_lorc_trad'),
            'land_area_measured': data.get('land_area_measured'),
            'land_area_meas_trad': data.get('land_area_meas_trad'),
            'land_area_deducted': data.get('land_area_deducted'),
            'land_area_ded_trad': data.get('land_area_ded_trad'),
            'considered_area': data.get('considered_area'),
            'land_area': data.get('land_area'),
            'area_unit': data.get('area_unit'),
            'land_shape': data.get('land_shape'),
            'land_topography': data.get('land_topography'),
            'land_level': data.get('land_level', ''),
            'nature_of_soil': data.get('nature_of_soil', ''),
            'construction_on_land': data.get('construction_on_land', ''),
            'positive_features': data.get('positive_features', ''),
            'negative_features': data.get('negative_features', ''),
            'frontage': data.get('frontage'),
            'lm_tri_a_a': data.get('lm_tri_a_a', ''), 'lm_tri_a_b': data.get('lm_tri_a_b', ''),
            'lm_tri_a_c': data.get('lm_tri_a_c', ''), 'lm_tri_a_s': data.get('lm_tri_a_s', ''),
            'lm_tri_a_sqft': data.get('lm_tri_a_sqft', ''), 'lm_tri_a_aana': data.get('lm_tri_a_aana', ''),
            'lm_tri_b_a': data.get('lm_tri_b_a', ''), 'lm_tri_b_b': data.get('lm_tri_b_b', ''),
            'lm_tri_b_c': data.get('lm_tri_b_c', ''), 'lm_tri_b_s': data.get('lm_tri_b_s', ''),
            'lm_tri_b_sqft': data.get('lm_tri_b_sqft', ''), 'lm_tri_b_aana': data.get('lm_tri_b_aana', ''),
            'ded_tri_a_a': data.get('ded_tri_a_a', ''), 'ded_tri_a_b': data.get('ded_tri_a_b', ''),
            'ded_tri_a_c': data.get('ded_tri_a_c', ''), 'ded_tri_a_s': data.get('ded_tri_a_s', ''),
            'ded_tri_a_sqft': data.get('ded_tri_a_sqft', ''), 'ded_tri_a_aana': data.get('ded_tri_a_aana', ''),
            'ded_tri_b_a': data.get('ded_tri_b_a', ''), 'ded_tri_b_b': data.get('ded_tri_b_b', ''),
            'ded_tri_b_c': data.get('ded_tri_b_c', ''), 'ded_tri_b_s': data.get('ded_tri_b_s', ''),
            'ded_tri_b_sqft': data.get('ded_tri_b_sqft', ''), 'ded_tri_b_aana': data.get('ded_tri_b_aana', ''),
            # Boundaries
            'north_boundary': data.get('north_boundary'),
            'south_boundary': data.get('south_boundary'),
            'east_boundary': data.get('east_boundary'),
            'west_boundary': data.get('west_boundary'),
            # Building
            'total_area': data.get('total_area'),
            'built_area': data.get('built_area'),
            'carpet_area': data.get('carpet_area'),
            'number_of_units': data.get('number_of_units'),
            'bedrooms': data.get('bedrooms'),
            'bathrooms': data.get('bathrooms'),
            'parking_spaces': data.get('parking_spaces'),
            'construction_year': data.get('construction_year'),
            'property_age': data.get('property_age'),
            'facing': data.get('facing'),
            'furnishing': data.get('furnishing'),
            # Infrastructure
            'motorable_access': data.get('motorable_access'),
            'road_access_field': data.get('road_access_field'),
            'road_width': data.get('road_width'),
            'road_type': data.get('road_type'),
            'road_side': data.get('road_side'),
            'electricity_line': data.get('electricity_line'),
            'water_supply': data.get('water_supply'),
            'sewerage': data.get('sewerage'),
            'tv_cable': data.get('tv_cable'),
            'telephone': data.get('telephone'),
            'public_transport_distance': data.get('public_transport_distance'),
            'nearest_landmark': data.get('nearest_landmark'),
            'landmark_coordinates': data.get('landmark_coordinates'),
            'nearest_market': data.get('nearest_market'),
            # Valuation
            'commercial_rate_per_aana': data.get('commercial_rate_per_aana'),
            'government_rate_per_aana': data.get('government_rate_per_aana'),
            'fair_market_value_land': data.get('fair_market_value_land'),
            'fair_market_value_building': data.get('fair_market_value_building'),
            'fair_market_value_total': data.get('fair_market_value_total'),
            'market_value_land': data.get('market_value_land'),
            'market_value_building': data.get('market_value_building'),
            'govt_value_remarks': data.get('govt_value_remarks', ''),
            'market_value_remarks': data.get('market_value_remarks', 'As from Local People and the judgement of the valuator'),
            'land_area_aana_decimal': data.get('land_area_aana_decimal'),
            'summary_remarks': data.get('summary_remarks', ''),
            'distress_value_land': data.get('distress_value_land'),
            'distress_value_building': data.get('distress_value_building'),
            'distress_value_total': data.get('distress_value_total'),
            'valuation_in_words': data.get('valuation_in_words'),
            'purchase_price': data.get('purchase_price'),
            'estimated_value': data.get('estimated_value'),
            'rental_value': data.get('rental_value'),
            'currency': data.get('currency'),
            # Legal
            'survey_number': data.get('survey_number'),
            'ownership_type': data.get('ownership_type'),
            'hold_type': data.get('hold_type'),
            'mode_of_acquisition': data.get('mode_of_acquisition'),
            'lorc_registration_date': data.get('lorc_registration_date'),
            'land_revenue_payment_date': data.get('land_revenue_payment_date'),
            'legal_reference_no': data.get('legal_reference_no'),
            'land_revenue_paid':         data.get('land_revenue_paid', True),
            'sale_gift_elapsed':         data.get('sale_gift_elapsed', True),
            'maps_plots_indicated':      data.get('maps_plots_indicated', True),
            'maps_access_marked':        data.get('maps_access_marked', True),
            'maps_shape_tallies':        data.get('maps_shape_tallies', True),
            'boundary_cert_available':   data.get('boundary_cert_available', True),
            'boundary_cert_date':        data.get('boundary_cert_date', ''),
            'free_access_available':     data.get('free_access_available', True),
            'acquisition_notice':        data.get('acquisition_notice', False),
            'boundary_clearly_defined':  data.get('boundary_clearly_defined', True),
            'ownership_comments':        data.get('ownership_comments', 'None'),
            'land_revenue_comments':     data.get('land_revenue_comments', 'None'),
            'land_registration_comments': data.get('land_registration_comments', 'None'),
            'maps_comments':             data.get('maps_comments', 'None'),
            'area_change_comments':      data.get('area_change_comments', 'None'),
            'boundary_cert_comments':    data.get('boundary_cert_comments', 'None'),
            'general_legal_comments':    data.get('general_legal_comments', 'None'),
            # Influencing factors
            'near_army_barracks':    data.get('near_army_barracks', False),
            'near_cremation_area':   data.get('near_cremation_area', False),
            'near_dumping_site':     data.get('near_dumping_site', False),
            'near_fuel_depot':       data.get('near_fuel_depot', False),
            'near_hazardous_factory':data.get('near_hazardous_factory', False),
            'near_high_tension_line':data.get('near_high_tension_line', False),
            'near_monument':         data.get('near_monument', False),
            'near_river_stream':     data.get('near_river_stream', False),
            'near_temple':           data.get('near_temple', False),
            'water_logging':         data.get('water_logging', False),
            'amenities': data.get('amenities'),
            'landmark': data.get('landmark'),
            'documents': data.get('documents'),
            'photos': data.get('photos'),
            'notes': data.get('notes'),
            'status': data.get('status'),
            'created_by': data.get('created_by'),
            'created_at': data.get('created_at'),
            'updated_at': data.get('updated_at')
        }
