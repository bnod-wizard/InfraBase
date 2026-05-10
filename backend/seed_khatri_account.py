"""
Seed script — Ram Bahadur Khatri / Plot 298 valuation account.
Run from the backend/ directory:
  python seed_khatri_account.py

Requires the Flask server to be running on localhost:5001.
Uses the default admin credentials (admin@infrabase.com / admin123).
"""
import requests
import json

BASE = 'http://localhost:5001/api'


def login():
    r = requests.post(f'{BASE}/auth/login',
                      json={'email': 'admin@infrabase.com', 'password': 'admin123'})
    r.raise_for_status()
    token = r.json().get('token') or r.json().get('data', {}).get('token')
    if not token:
        raise RuntimeError(f'Login failed: {r.json()}')
    print('✓ Logged in')
    return token


def create_account(token):
    headers = {'Authorization': f'Bearer {token}'}

    payload = {
        'account': {
            'account_name': 'Ram Bahadur Khatri',
            'email':        'khatri.plot298.jorpati@example.com',
            'phone':        '9765014537',
            'address':      'Jiri Municipality-2, Dolakha District, Nepal',
            'city':         'Dolakha',
            'country':      'Nepal',
            'status':       'Active',
        },
        'clients': [
            {
                'first_name':        'Ram Bahadur',
                'last_name':         'Khatri',
                'title':             'Mr.',
                'entity_type':       'individual',
                'gender':            'male',
                'email':             'ram.khatri.client@example.com',
                'phone':             '9765014537',
                'vdc_municipality':  'Jiri Municipality',
                'ward_no':           '2',
                'district':          'Dolakha',
                'city':              'Dolakha',
                'country':           'Nepal',
            }
        ],
        'properties': [
            {
                'temp_id':                  'prop_1',
                'property_name':            'Plot 298 – Gokarneshwor Municipality',
                'property_type':            'Land',
                'property_mortgaged':       'Land',
                'plot_no':                  '298',
                'address':                  'Gokarneshwor Municipality-6 (Sabik Jorpati VDC-4), Kathmandu District',
                'vdc_municipality':         'Gokarneshwor Municipality',
                'ward_no':                  '6',
                'sabik_vdc':                'Jorpati VDC',
                'sabik_ward_no':            '4',
                'district':                 'Kathmandu',
                'country':                  'Nepal',
                # Land area  (2.55 Aana  →  0 Ropani-2 Aana-2 Paisa-1 Dam approx.)
                'land_area_lorc':           2.55,
                'land_area_lorc_trad':      '0-2-2-1',
                'land_area_measured':       2.55,
                'land_area_meas_trad':      '0-2-2-1',
                # Rates (per Aana, NPR)
                'government_rate_per_aana': 890000,
                'commercial_rate_per_aana': 4850000,
                'gov_ratio':                50,
                # Valuation (NPR)
                'fair_market_value_land':    7318000,
                'fair_market_value_building': None,
                'fair_market_value_total':   7318000,
                'distress_value_land':       7318000,
                'distress_value_total':      7318000,
                'valuation_in_words':        'Seven Million Three Hundred Eighteen Thousand',
                # Services
                'motorable_access': True,
                'electricity_line': True,
                'water_supply':     True,
                'status': 'Active',
            }
        ],
        'owners': [
            {
                'owner_name':       'Ram Bahadur Khatri',
                'title':            'Mr.',
                'owner_type':       'individual',
                'email':            'ram.khatri.owner1@example.com',
                'phone':            '9765014537',
                'vdc_municipality': 'Jiri Municipality',
                'ward_no':          '2',
                'district':         'Dolakha',
                'country':          'Nepal',
                'property_temp_id': 'prop_1',
            },
            {
                'owner_name':       'Saru Khatri',
                'title':            'Mrs.',
                'owner_type':       'individual',
                'email':            'saru.khatri.owner2@example.com',
                'phone':            '9851002598',
                'vdc_municipality': 'Jiri Municipality',
                'ward_no':          '2',
                'district':         'Dolakha',
                'country':          'Nepal',
                'property_temp_id': 'prop_1',
            },
        ],
    }

    r = requests.post(f'{BASE}/accounts/bulk/create', json=payload, headers=headers)
    r.raise_for_status()
    body = r.json()
    if not body.get('success'):
        raise RuntimeError(f'Account creation failed: {body}')

    account_id = body['data']['account']['_id']
    print(f'✓ Account created  →  {account_id}')
    return account_id


def create_valuation(token, account_id):
    headers = {'Authorization': f'Bearer {token}'}

    valuation = {
        'bank_name':          'M/S. Agricultural Development Bank Ltd.',
        'bank_branch':        'Jorpati Branch',
        'bank_address':       'Jorpati, Kathmandu',
        'firm_name':          'Dream Project Engineering Consultancy Pvt. Ltd.',
        'firm_address':       'Loktantrik Chowk, Tarkeshwor-10, Kathmandu, Nepal',
        'firm_phone':         '+977-9851246415 / 01-4027350',
        'firm_email':         'dreamprojectengineering@gmail.com',
        'inspection_date':    '2026-04-30',
        'certification_date': '2026-04-30',
        'ref_no':             'DPEC/2026/001',
        'fiscal_year':        '2082/83',
        'nec_class':          'A',
    }

    r = requests.post(f'{BASE}/accounts/{account_id}/valuation', json=valuation, headers=headers)
    r.raise_for_status()
    body = r.json()
    if not body.get('success'):
        print(f'  ⚠ Valuation save warning: {body}')
    else:
        print('✓ Valuation metadata saved')


if __name__ == '__main__':
    token      = login()
    account_id = create_account(token)
    create_valuation(token, account_id)
    print(f'\n✓ Done.  Open the account in the app to generate documents.')
    print(f'  Account ID: {account_id}')
    print(f'\n  Place the company logo at:')
    print(f'  backend/templates/firm_logo.png')
    print(f'  (then regenerate the cover to see it)')
