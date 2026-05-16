import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import accountApi from '../services/accountApi';
import GenerateDocModal from './GenerateDocModal';
import UploadDocumentModal from './UploadDocumentModal';
import PropertyMapModal from './PropertyMapModal';
import AccountStagePath from './AccountStagePath';
import AreaCalculatorModal from './AreaCalculatorModal';
import AddToAccountModal from './AddToAccountModal';
import ConfirmModal from './ConfirmModal';
import { IconView, IconDelete, IconDownload, IconAdd, IconEdit, IconUpload } from './Icons';
import { useToast } from '../context';
import '../styles/AccountDetail.css';

const STATUS_OPTIONS = [
  'Active', 'Prospect', 'Bank Verification', 'Bank Verified',
  'Payment Pending', 'Paid', 'Lost', 'Archived', 'Inactive',
];

const pillClass = status => {
  switch ((status || '').toLowerCase()) {
    case 'active':            return 'ok';
    case 'paid':              return 'ok';
    case 'bank verified':     return 'info';
    case 'bank verification': return 'review';
    case 'prospect':          return 'review';
    case 'payment pending':   return 'warn';
    case 'pending':           return 'warn';
    case 'lost':
    case 'overdue':           return 'due';
    case 'deleted':
    case 'archived':
    case 'inactive':
    case 'closed':            return 'draft';
    default:                  return 'draft';
  }
};

function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [hierarchy,        setHierarchy]        = useState(null);
  const [changelog,         setChangelog]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [isEditing,        setIsEditing]        = useState(false);
  const [formData,         setFormData]         = useState({
    account_name: '', company_registration: '', registration_number: '',
    tax_id: '', business_type: '', phone: '', email: '', website: '',
    address: '', ward_no: '', vdc_municipality: '', district: '', country: '',
    logo_url: '', status: 'active', created_by: '', created_at: '', updated_at: '',
  });
  const [activeObjectEdit, setActiveObjectEdit] = useState({ type: null, id: null, data: null });
  const [isDocModalOpen,    setIsDocModalOpen]    = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sidebarDocs,       setSidebarDocs]       = useState([]);
  const [docToDelete,       setDocToDelete]       = useState(null);
  const [areaCalcCtx,       setAreaCalcCtx]       = useState(null); // { property, type: 'measurement'|'lalpurja'|'deduction' }
  const [mapProperty,       setMapProperty]       = useState(null);
  const [stageSaving,       setStageSaving]       = useState(false);
  const [addModal,          setAddModal]          = useState(null); // 'client' | 'owner' | 'property'

  const accountFields = [
    { accessor: 'account_name',         label: 'Account Name',     np: 'खाता नाम' },
    { accessor: 'email',                label: 'Email',            np: 'इमेल' },
    { accessor: 'phone',                label: 'Phone',            np: 'फोन' },
    { accessor: 'business_type',        label: 'Business Type',    np: 'व्यापार प्रकार' },
    { accessor: 'company_registration', label: 'Company Reg.',     np: 'कम्पनी दर्ता' },
    { accessor: 'registration_number',  label: 'Registration No.', np: 'दर्ता नम्बर' },
    { accessor: 'tax_id',               label: 'Tax ID',           np: 'कर परिचय पत्र' },
    { accessor: 'website',              label: 'Website',          np: 'वेबसाइट' },
    { accessor: 'address',          label: 'Address / Tole',       np: 'ठेगाना / टोल', fullWidth: true },
    { accessor: 'ward_no',          label: 'Ward No.',             np: 'वडा नं.' },
    { accessor: 'vdc_municipality', label: 'Municipality / VDC',   np: 'नगरपालिका / गाविस' },
    { accessor: 'district',         label: 'District',             np: 'जिल्ला' },
    { accessor: 'country',          label: 'Country',              np: 'देश' },
    { accessor: 'status',               label: 'Status',           np: 'स्थिति', type: 'select', options: STATUS_OPTIONS },
  ];

  const clientFields = [
    { title: 'Identity', np: 'परिचय', fields: [
      { accessor: 'entity_type', label: 'Entity Type', np: 'ग्राहक प्रकार', type: 'select', options: ['individual', 'company'] },
      { accessor: 'gender',      label: 'Gender',      np: 'लिङ्ग',         type: 'select', options: ['male', 'female'] },
      { accessor: 'title',       label: 'Title',       np: 'उपाधि' },
      { accessor: 'first_name',  label: 'First Name',  np: 'पहिलो नाम' },
      { accessor: 'last_name',   label: 'Last Name',   np: 'थर' },
      { accessor: 'designation', label: 'Designation', np: 'पद' },
      { accessor: 'status',      label: 'Status',      np: 'स्थिति', type: 'select', options: ['active', 'inactive'] },
    ]},
    { title: 'Contact', np: 'सम्पर्क', fields: [
      { accessor: 'email',  label: 'Email',       np: 'इमेल' },
      { accessor: 'phone',  label: 'Contact No.', np: 'सम्पर्क नं.' },
      { accessor: 'mobile', label: 'Mobile',      np: 'मोबाइल' },
    ]},
    { title: 'Address', np: 'ठेगाना', fields: [
      { accessor: 'address',          label: 'Address / Tole',     np: 'ठेगाना / टोल',            fullWidth: true },
      { accessor: 'ward_no',          label: 'Ward No.',           np: 'वडा नं.' },
      { accessor: 'vdc_municipality', label: 'Municipality / VDC', np: 'नगरपालिका / गाविस' },
      { accessor: 'district',         label: 'District',           np: 'जिल्ला' },
      { accessor: 'country',          label: 'Country',            np: 'देश' },
    ]},
    { title: 'Citizenship', np: 'नागरिकता', fields: [
      { accessor: 'citizenship_no',            label: 'Citizenship No.', np: 'नागरिकता नं.' },
      { accessor: 'citizenship_issued_date',   label: 'Issued Date',     np: 'जारी मिति' },
      { accessor: 'citizenship_issued_office', label: 'Issued Office',   np: 'जारी कार्यालय', fullWidth: true },
    ]},
    { title: 'Family', np: 'परिवार', fields: [
      { accessor: 'father_name',      label: "Father's Name",      np: 'बुबाको नाम' },
      { accessor: 'grandfather_name', label: "Grandfather's Name", np: 'हजुरबुबाको नाम' },
      { accessor: 'husband_name',     label: "Husband's Name",     np: 'पतिको नाम' },
    ]},
    { title: 'Other', np: 'अन्य', fields: [
      { accessor: 'pan_no', label: 'PAN No.', np: 'स्थायी लेखा नं.' },
      { accessor: 'notes',  label: 'Notes',   np: 'टिप्पणी', fullWidth: true },
    ]},
  ];

  const propertyFields = [
    { title: 'Property Info', np: 'सम्पत्ति जानकारी', fields: [
      { accessor: 'property_name',      label: 'Property Name', np: 'सम्पत्तिको नाम' },
      { accessor: 'property_type',      label: 'Type',          np: 'प्रकार',   type: 'select', options: ['land', 'building', 'land_and_building', 'apartment', 'commercial', 'industrial'] },
      { accessor: 'property_mortgaged', label: 'Mortgaged',     np: 'धितो',     type: 'select', options: ['Land', 'Building', 'Both'] },
      { accessor: 'property_status',    label: 'Status',        np: 'स्थिति',   type: 'select', options: ['active', 'inactive', 'vacant', 'occupied'] },
      { accessor: 'plot_no',            label: 'Plot No.',      np: 'कित्ता नं.' },
      { accessor: 'sheet_no',           label: 'Sheet No.',     np: 'सिट नं.' },
    ]},
    { title: 'Location', np: 'स्थान', fields: [
      { accessor: 'district',         label: 'District',                   np: 'जिल्ला' },
      { accessor: 'ward_no',          label: 'Present Ward No.',           np: 'वर्तमान वडा नं.' },
      { accessor: 'vdc_municipality', label: 'Present Municipality / VDC', np: 'वर्तमान नगरपालिका / गाविस' },
      { accessor: 'sabik_vdc',        label: 'Sabik VDC',                  np: 'साबिक गाविस' },
      { accessor: 'sabik_ward_no',    label: 'Sabik Ward No.',             np: 'साबिक वडा नं.' },
      { accessor: 'tole',             label: 'Tole / Locality',            np: 'टोल / स्थानीयता' },
      { accessor: 'address',          label: 'Address',                    np: 'ठेगाना', fullWidth: true },
      { accessor: 'gps_coordinates',  label: 'GPS Coordinates',            np: 'जीपीएस निर्देशांक' },
    ]},
    { title: 'Land Area', np: 'जग्गा क्षेत्रफल', fields: [
      { accessor: 'land_area_lorc',       label: 'As per Lalpurja',        np: 'लालपुर्जाअनुसार',    type: 'area_sq', sqftSource: 'land_area_as_per_lalpurja' },
      { accessor: 'land_area_lorc_trad',  label: 'Lalpurja (R-A-P-D)',     np: 'लालपुर्जा (र-आ-प-दा)' },
      { accessor: 'land_area_measured',   label: 'As per Measurement',     np: 'नापीअनुसार',          type: 'area_sq', sqftSource: 'land_area_as_per_measurement' },
      { accessor: 'land_area_meas_trad',  label: 'Measurement (R-A-P-D)',  np: 'नापी (र-आ-प-दा)' },
      { accessor: 'land_area_deducted',      label: 'After Deduction',        np: 'कटाई पछि',            type: 'area_sq', sqftSource: 'land_area_after_deduction' },
      { accessor: 'land_area_ded_trad',      label: 'After Deduction (R-A-P-D)', np: 'कटाई पछि (र-आ-प-दा)' },
      { accessor: 'road_deduction_percent',  label: 'Road Deduction %',       np: 'सडक कटाई %' },
      { accessor: 'considered_area',         label: 'Area Considered',        np: 'विचारयोग्य क्षेत्रफल', type: 'area_sq', sqftSource: 'land_area_after_deduction' },
      { accessor: 'land_shape',           label: 'Land Shape',             np: 'जग्गाको आकार' },
      { accessor: 'land_topography',      label: 'Topography',             np: 'भूगोल' },
      { accessor: 'land_level',           label: 'Level of Land',          np: 'जग्गाको स्तर' },
      { accessor: 'nature_of_soil',       label: 'Nature of Soil',         np: 'माटोको प्रकृति' },
      { accessor: 'construction_on_land', label: 'Any Construction on Land', np: 'जग्गामा निर्माण' },
      { accessor: 'frontage',             label: 'Frontage (ft)',          np: 'सामुन्ने (फिट)' },
    ]},
    { title: 'Land Features', np: 'जग्गाका विशेषताहरू', fields: [
      { accessor: 'positive_features', label: 'Positive Features', np: 'सकारात्मक विशेषताहरू', fullWidth: true },
      { accessor: 'negative_features', label: 'Negative Features', np: 'नकारात्मक विशेषताहरू', fullWidth: true },
      { accessor: 'location_merits',   label: 'Merits of Location', np: 'स्थानका विशेषताहरू — one per line', type: 'textarea', fullWidth: true },
    ]},
    { title: 'Field Survey — Triangles', np: 'क्षेत्र सर्वेक्षण — त्रिभुज', fields: [
      { accessor: 'land_area_as_per_measurement', label: 'Measurement Area (नापी)',    type: 'triangle_group', calcType: 'measurement' },
      { accessor: 'land_area_as_per_lalpurja',    label: 'Lalpurja Area (लालपुर्जा)', type: 'triangle_group', calcType: 'lalpurja' },
      { accessor: 'land_area_after_deduction',    label: 'After Deduction (कटाई पछि)', type: 'triangle_group', calcType: 'deduction' },
    ]},
    { title: 'Boundaries', np: 'चार किल्ला', fields: [
      { accessor: 'north_boundary', label: 'North', np: 'उत्तर' },
      { accessor: 'south_boundary', label: 'South', np: 'दक्षिण' },
      { accessor: 'east_boundary',  label: 'East',  np: 'पूर्व' },
      { accessor: 'west_boundary',  label: 'West',  np: 'पश्चिम' },
    ]},
    { title: 'Building', np: 'भवन', fields: [
      { accessor: 'structural_system',    label: 'Type of Structure',       np: 'संरचनाको प्रकार' },
      { accessor: 'purpose_of_building',  label: 'Purpose of Building',     np: 'भवनको उद्देश्य' },
      { accessor: 'no_of_floors',         label: 'No. of Floors',           np: 'तलाको संख्या' },
      { accessor: 'total_sqft_drawing',   label: 'Total Sq.Ft in Drawing',  np: 'नक्शामा वर्गफिट' },
      { accessor: 'total_area',           label: 'Total Area',              np: 'कुल क्षेत्रफल' },
      { accessor: 'built_area',           label: 'Built Area',              np: 'निर्मित क्षेत्रफल' },
      { accessor: 'area_unit',            label: 'Area Unit',               np: 'क्षेत्रफल एकाइ', type: 'select', options: ['sqm', 'sqft', 'aana', 'ropani'] },
      { accessor: 'thickness_of_slab',    label: 'Thickness of Slab',       np: 'स्ल्याबको मोटाई' },
      { accessor: 'thickness_of_wall',    label: 'Thickness of Wall',       np: 'भित्ताको मोटाई' },
      { accessor: 'height_each_floor',    label: 'Height of Each Floor',    np: 'प्रत्येक तलाको उचाइ' },
      { accessor: 'total_height_building',label: 'Total Height of Building', np: 'भवनको कुल उचाइ' },
      { accessor: 'breadth_of_building',  label: 'Breadth of Building',     np: 'भवनको चौडाइ' },
      { accessor: 'length_of_building',   label: 'Length of Building',      np: 'भवनको लम्बाइ' },
      { accessor: 'foundation_type',      label: 'Foundation Type',         np: 'जगको प्रकार' },
      { accessor: 'building_age',         label: 'Age of Building',         np: 'भवनको उमेर' },
      { accessor: 'expected_life',        label: 'Expected Life',           np: 'अपेक्षित आयु' },
      { accessor: 'construction_on_land', label: 'Construction on Land',    np: 'जग्गामा निर्माण' },
      { accessor: 'bedrooms',             label: 'Bedrooms',                np: 'शयनकक्ष' },
      { accessor: 'bathrooms',            label: 'Bathrooms',               np: 'शौचालय' },
      { accessor: 'construction_year',    label: 'Built Year',              np: 'निर्माण वर्ष' },
      { accessor: 'remarkable_defects',   label: 'Any Defects',             np: 'कुनै त्रुटि', fullWidth: true },
      { accessor: 'repair_maintenance',   label: 'Repair & Maintenance',    np: 'मर्मत सम्भार' },
      { accessor: 'underground_water_tank', label: 'Underground Water Tank', np: 'भूमिगत पानी ट्याङ्की', type: 'bool' },
      { accessor: 'overhead_water_tank',  label: 'Overhead Water Tank',     np: 'माथिल्लो पानी ट्याङ्की', type: 'bool' },
      { accessor: 'solar_panel',          label: 'Solar Panel',             np: 'सौर्य प्यानल', type: 'bool' },
      { accessor: 'deep_boring_tube_well',label: 'Deep Boring / Tube Well', np: 'डिप बोरिङ', type: 'bool' },
    ]},
    { title: 'Road & Access', np: 'सडक र पहुँच', fields: [
      { accessor: 'road_access_field',         label: 'Road Access (full description)', np: 'सडक पहुँच (पूर्ण विवरण)', fullWidth: true },
      { accessor: 'road_width',                label: 'Road Width (ft)',               np: 'सडक चौडाइ (फिट)' },
      { accessor: 'road_type',                 label: 'Road Type',                     np: 'सडक प्रकार', type: 'select', options: ['Pitched Road', 'Concrete Slab Road', 'Gravelled Road', 'Earthen Road', 'Block Paved Road', 'Stone Paved Road', 'Foot Trail'] },
      { accessor: 'road_side',                 label: 'Road Side',                     np: 'सडक दिशा',   type: 'select', options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] },
      { accessor: 'nearest_landmark',          label: 'Nearest Landmark',              np: 'नजिकको ल्यान्डमार्क' },
      { accessor: 'landmark_coordinates',      label: 'Landmark GPS',                  np: 'ल्यान्डमार्क जीपीएस' },
      { accessor: 'nearest_market',            label: 'Nearest Market',                np: 'नजिकको बजार' },
      { accessor: 'public_transport_distance', label: 'Public Transport Distance',     np: 'सार्वजनिक यातायात दूरी' },
    ]},
    { title: 'Services', np: 'सेवाहरू', fields: [
      { accessor: 'motorable_access', label: 'Motorable Access',   np: 'मोटर पहुँच',  type: 'bool' },
      { accessor: 'water_supply',     label: 'Water Supply Line',  np: 'खानेपानी',    type: 'bool' },
      { accessor: 'sewerage',         label: 'Sewerage Pipe Line', np: 'ढलपाइप',     type: 'bool' },
      { accessor: 'electricity_line', label: 'Electricity Line',   np: 'बिजुली',      type: 'bool' },
      { accessor: 'telephone',        label: 'Telephone Line',     np: 'टेलिफोन',     type: 'bool' },
      { accessor: 'tv_cable',         label: 'TV Cable',           np: 'टिभी केबल',   type: 'bool' },
    ]},
    { title: 'Influencing Factors', np: 'प्रभावकारी तत्वहरू', fields: [
      { accessor: 'near_river_stream',      label: 'River / Stream nearby',      np: 'नदी / खोला नजिक',         type: 'bool' },
      { accessor: 'near_high_tension_line', label: 'High-tension Line nearby',   np: 'उच्च तनाव लाइन नजिक',    type: 'bool' },
      { accessor: 'near_fuel_depot',        label: 'Fuel Depot nearby',          np: 'इन्धन डिपो नजिक',         type: 'bool' },
      { accessor: 'near_temple',            label: 'Temple / Shrine nearby',     np: 'मन्दिर / धर्मस्थल नजिक', type: 'bool' },
      { accessor: 'water_logging',          label: 'Water Logging',              np: 'पानी जमिने',               type: 'bool' },
      { accessor: 'near_cremation_area',    label: 'Cremation Area nearby',      np: 'शमशान घाट नजिक',          type: 'bool' },
      { accessor: 'near_army_barracks',     label: 'Army Barracks nearby',       np: 'सेना ब्यारेक नजिक',       type: 'bool' },
      { accessor: 'near_monument',          label: 'Monument nearby',            np: 'स्मारक नजिक',              type: 'bool' },
      { accessor: 'near_hazardous_factory', label: 'Hazardous Factory nearby',   np: 'हानिकारक कारखाना नजिक',   type: 'bool' },
      { accessor: 'near_dumping_site',      label: 'Dumping Site nearby',        np: 'फोहोर डम्पिङ नजिक',       type: 'bool' },
    ]},
    { title: 'Valuation', np: 'मूल्यांकन', fields: [
      { accessor: 'government_rate_per_aana',   label: 'Govt Rate / Aana',         np: 'सरकारी दर / आना' },
      { accessor: 'commercial_rate_per_aana',   label: 'Market Rate / Aana',        np: 'बजार दर / आना' },
      { accessor: 'land_area_aana_decimal',     label: 'Land Area (Aana, decimal)', np: 'जग्गा क्षेत्रफल (आना)' },
      { accessor: 'market_value_land',          label: 'Market Value — Land',       np: 'बजार मूल्य — जग्गा' },
      { accessor: 'market_value_building',      label: 'Market Value — Building',   np: 'बजार मूल्य — भवन' },
      { accessor: 'govt_value_remarks',         label: 'Govt Value Remarks',        np: 'सरकारी मूल्य टिप्पणी' },
      { accessor: 'market_value_remarks',       label: 'Market Value Remarks',      np: 'बजार मूल्य टिप्पणी', fullWidth: true },
      { accessor: 'fair_market_value_land',     label: 'FMV — Land',               np: 'उचित बजार मूल्य — जग्गा' },
      { accessor: 'fair_market_value_building', label: 'FMV — Building',            np: 'उचित बजार मूल्य — भवन' },
      { accessor: 'fair_market_value_total',    label: 'FMV — Total',              np: 'उचित बजार मूल्य — जम्मा' },
      { accessor: 'distress_value_total',       label: 'Distress Value',            np: 'विपद् मूल्य' },
      { accessor: 'valuation_in_words',         label: 'Value in Words',            np: 'अक्षरमा मूल्य', fullWidth: true },
      { accessor: 'summary_remarks',            label: 'Summary Remarks',           np: 'सारांश टिप्पणी', fullWidth: true },
    ]},
    { title: 'Legal — Land Ownership', np: 'कानूनी — जग्गा स्वामित्व', fields: [
      { accessor: 'ownership_type',     label: 'Type of Ownership', np: 'स्वामित्वको प्रकार' },
      { accessor: 'hold_type',          label: 'Ownership of Land', np: 'जग्गाको स्वामित्व' },
      { accessor: 'ownership_comments', label: 'Comments',          np: 'टिप्पणी' },
    ]},
    { title: 'Legal — Land Revenue (Malpot)', np: 'कानूनी — मालपोत', fields: [
      { accessor: 'land_revenue_paid',         label: 'Current Revenue Paid', np: 'हालको मालपोत तिरेको', type: 'bool' },
      { accessor: 'land_revenue_payment_date', label: 'Date of Payment',      np: 'भुक्तानी मिति' },
      { accessor: 'land_revenue_comments',     label: 'Comments',             np: 'टिप्पणी' },
    ]},
    { title: 'Legal — Land Registration', np: 'कानूनी — जग्गा दर्ता', fields: [
      { accessor: 'mode_of_acquisition',        label: 'Normal Sale / Gift',           np: 'सामान्य बिक्री / उपहार' },
      { accessor: 'lorc_registration_date',     label: 'Date of Registration',         np: 'दर्ता मिति' },
      { accessor: 'sale_gift_elapsed',          label: '6-Month 35-Day Period Elapsed', np: '६ महिना ३५ दिन अवधि', type: 'bool' },
      { accessor: 'land_registration_comments', label: 'Comments',                     np: 'टिप्पणी' },
    ]},
    { title: 'Legal — Survey Maps', np: 'कानूनी — नक्शा', fields: [
      { accessor: 'maps_plots_indicated', label: 'Plots Indicated on Map',       np: 'नक्शामा कित्ता देखाइएको', type: 'bool' },
      { accessor: 'maps_access_marked',   label: 'Access Clearly Marked on Map', np: 'नक्शामा पहुँच स्पष्ट',    type: 'bool' },
      { accessor: 'maps_shape_tallies',   label: 'Field Shape Tallies with Map', np: 'नक्शासँग आकार मिल्छ',     type: 'bool' },
      { accessor: 'maps_comments',        label: 'Comments',                     np: 'टिप्पणी' },
      { accessor: 'area_change_comments', label: 'Area Change Comments',         np: 'क्षेत्रफल परिवर्तन टिप्पणी' },
    ]},
    { title: 'Legal — Boundary Certificate', np: 'कानूनी — किल्ला प्रमाणपत्र', fields: [
      { accessor: 'boundary_cert_available', label: 'Boundary Certificate Available', np: 'सीमा प्रमाणपत्र उपलब्ध', type: 'bool' },
      { accessor: 'boundary_cert_date',      label: 'Date of Certification',          np: 'प्रमाणीकरण मिति' },
      { accessor: 'boundary_cert_comments',  label: 'Comments',                       np: 'टिप्पणी' },
    ]},
    { title: 'Legal — General', np: 'कानूनी — सामान्य', fields: [
      { accessor: 'free_access_available',    label: 'Free Access Available',             np: 'स्वतन्त्र पहुँच उपलब्ध', type: 'bool' },
      { accessor: 'acquisition_notice',       label: 'Govt Acquisition Notice Issued',    np: 'सरकारी अधिग्रहण सूचना', type: 'bool' },
      { accessor: 'boundary_clearly_defined', label: 'Boundary Clearly Defined on Site',  np: 'सीमा स्पष्ट',           type: 'bool' },
      { accessor: 'general_legal_comments',   label: 'Comments',                          np: 'टिप्पणी' },
      { accessor: 'legal_reference_no',       label: 'Reference No.',                     np: 'सन्दर्भ नं.' },
    ]},
    { title: 'Notes', np: 'टिप्पणी', fields: [
      { accessor: 'notes', label: 'Notes', np: 'टिप्पणी', fullWidth: true },
    ]},
  ];

  const ownerFields = [
    { accessor: 'owner_name',  label: 'Owner Name',  np: 'मालिकको नाम' },  { accessor: 'owner_type', label: 'Owner Type',  np: 'मालिक प्रकार' },
    { accessor: 'title',       label: 'Title',       np: 'उपाधि' },         { accessor: 'email',      label: 'Email',       np: 'इमेल' },
    { accessor: 'phone',       label: 'Phone',       np: 'फोन' },           { accessor: 'mobile',     label: 'Mobile',      np: 'मोबाइल' },
    { accessor: 'address',          label: 'Address / Tole',     np: 'ठेगाना / टोल' },
    { accessor: 'ward_no',          label: 'Ward No.',           np: 'वडा नं.' },
    { accessor: 'vdc_municipality', label: 'Municipality / VDC', np: 'नगरपालिका / गाविस' },
    { accessor: 'district',         label: 'District',           np: 'जिल्ला' },
    { accessor: 'country',          label: 'Country',            np: 'देश' },           { accessor: 'id_type',    label: 'ID Type',     np: 'परिचय प्रकार' },
    { accessor: 'id_number',   label: 'ID Number',   np: 'परिचय नम्बर' },  { accessor: 'pan_number', label: 'PAN Number',  np: 'स्थायी लेखा नम्बर' },
    { accessor: 'notes',       label: 'Notes',       np: 'टिप्पणी' },       { accessor: 'status',     label: 'Status',      np: 'स्थिति' }
  ];

  useEffect(() => { if (accountId) fetchAccountHierarchy(); }, [accountId]);

  const fetchAccountHierarchy = async () => {
    setLoading(true); setError(null);
    try {
      const res = await accountApi.getAccountHierarchy(accountId);
      if (res.data?.success) {
        setHierarchy(res.data.data);
        setFormData(res.data.data.account || {});
        await fetchChangelog(); // Fetch changelog after hierarchy
      } else {
        setError(res.data?.message || 'Unable to load account details.');
      }
    } catch {
      setError('Failed to load account details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChangelog = async () => {
    try {
      const res = await accountApi.getAccountChangelog(accountId);
      if (res.data?.success) {
        setChangelog(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load changelog:', err);
    }
  };

  const fetchSidebarDocs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:5001/api/accounts/${accountId}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSidebarDocs(data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { if (accountId) fetchSidebarDocs(); }, [accountId]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError(null);
    if (!formData.account_name || !formData.email) { setError('Account name and email are required.'); return; }
    try {
      const res = await accountApi.updateAccount(accountId, formData);
      if (res.data?.success) {
        setHierarchy(prev => ({ ...prev, account: res.data.data }));
        setFormData(res.data.data);
        setIsEditing(false);
        toast('Account details saved');
        await fetchChangelog(); // Refresh changelog after status change
      } else {
        setError(res.data?.message || 'Failed to save changes.');
      }
    } catch { setError('Failed to save account changes.'); }
  };

  const handleCancel = () => {
    setError(null);
    if (hierarchy?.account) setFormData(hierarchy.account);
    setIsEditing(false);
  };

  const handleStageChange = async newStatus => {
    setStageSaving(true);
    try {
      const payload = { ...formData, status: newStatus };
      const res = await accountApi.updateAccount(accountId, payload);
      if (res.data?.success) {
        setFormData(res.data.data);
        setHierarchy(prev => ({ ...prev, account: res.data.data }));
        toast(`Status moved to ${newStatus}`);
        await fetchChangelog();
      } else {
        toast(res.data?.message || 'Failed to update status.');
      }
    } catch {
      toast('Network error — status not updated.');
    } finally {
      setStageSaving(false);
    }
  };

  const startObjectEdit  = (type, item) => setActiveObjectEdit({ type, id: item._id || item.id || null, data: { ...item } });
  const cancelObjectEdit = () => setActiveObjectEdit({ type: null, id: null, data: null });
  const handleObjectEditChange = (name, value) => setActiveObjectEdit(prev => ({ ...prev, data: { ...prev.data, [name]: value } }));

  const saveObjectEdit = async () => {
    if (!activeObjectEdit.type || !activeObjectEdit.id) { cancelObjectEdit(); return; }
    const { type, id, data } = activeObjectEdit;
    const typeLabel = type.replace(/s$/, ''); // clients→client, owners→owner, properties→propert…

    // Map collection name → API method
    const apiCall = {
      clients:    () => accountApi.updateClient(id, data),
      owners:     () => accountApi.updateOwner(id, data),
      properties: () => accountApi.updateProperty(id, data),
    }[type];

    if (!apiCall) { cancelObjectEdit(); return; }

    try {
      const res = await apiCall();
      if (res.data?.success) {
        const updated = res.data.data;
        setHierarchy(prev => {
          if (!prev) return prev;
          const list = Array.isArray(prev[type]) ? prev[type] : [];
          return { ...prev, [type]: list.map(item => (item._id || item.id) === id ? updated : item) };
        });
        cancelObjectEdit();
        toast(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} saved`);
      } else {
        toast(res.data?.message || 'Save failed — please try again.');
      }
    } catch (err) {
      toast('Network error — changes not saved.');
    }
  };

  const renderValue = value => {
    if (value === undefined || value === null || value === '') return '—';
    if (value === true  || value === 'true')  return 'Yes';
    if (value === false || value === 'false') return 'No';
    if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const handleBoolChange = (name, checked) =>
    setFormData(prev => ({ ...prev, [name]: checked }));

  const handleObjectBoolChange = (name, checked) =>
    handleObjectEditChange(name, checked);

  const formatDate = value => {
    if (!value) return '—';
    const s = /[Zz]|[+-]\d{2}:\d{2}$/.test(value) ? value : value + 'Z';
    const d = new Date(s);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getObjectHeader = (item, headerLabel, fallback) => {
    if (headerLabel === 'first_name') return `${item.first_name || ''} ${item.last_name || ''}`.trim() || fallback;
    return item[headerLabel] || fallback;
  };

  const renderFieldInput = field => {
    const raw   = formData[field.accessor];
    const value = raw ?? '';
    if (field.type === 'select') return (
      <select name={field.accessor} value={value} onChange={handleInputChange}>
        {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    );
    if (field.type === 'bool') {
      const checked = raw === true || raw === 'true';
      return (
        <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
          <input type="checkbox" checked={checked} onChange={e => handleBoolChange(field.accessor, e.target.checked)} />
        </label>
      );
    }
    return <input type={field.type || 'text'} name={field.accessor} value={value} onChange={handleInputChange} />;
  };

  const renderObjectFieldInput = (field, value) => {
    if (field.type === 'select') return (
      <select name={field.accessor} value={value || ''} onChange={e => handleObjectEditChange(field.accessor, e.target.value)}>
        {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    );
    if (field.type === 'bool') {
      const checked = value === true || value === 'true';
      return (
        <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
          <input type="checkbox" checked={checked} onChange={e => handleObjectBoolChange(field.accessor, e.target.checked)} />
        </label>
      );
    }
    if (field.type === 'textarea') {
      return <textarea name={field.accessor} value={value || ''} rows={4} onChange={e => handleObjectEditChange(field.accessor, e.target.value)} style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 'inherit', borderRadius: '10px' }} />;
    }
    return <input type={field.type || 'text'} name={field.accessor} value={value || ''} onChange={e => handleObjectEditChange(field.accessor, e.target.value)} />;
  };

  const fmtAreaByUnit = (sqmVal, areaUnit, structuredObj) => {
    const sqm = parseFloat(sqmVal) || 0;
    const obj = structuredObj || {};
    switch (areaUnit) {
      case 'sqft': {
        const v = parseFloat(obj.total_sqft) || (sqm * 10.7639);
        return { value: v > 0 ? v.toFixed(2) : '—', unit: 'Sq.Ft' };
      }
      case 'aana': {
        const v = parseFloat(obj.total_aana) || (sqm > 0 ? sqm / 31.8 : 0);
        return { value: v > 0 ? v.toFixed(2) : '—', unit: 'Aana' };
      }
      case 'ropani': {
        const v = sqm / 508.72;
        return { value: v > 0 ? v.toFixed(4) : '—', unit: 'Ropani' };
      }
      default:
        return { value: sqm > 0 ? sqm.toFixed(2) : '—', unit: 'Sq.M' };
    }
  };

  const renderTriangleGroup = (field, areaObj, item) => {
    const obj = areaObj || { triangles: [], total_sqft: '', total_sqm: '', total_aana: '', rapd: '' };
    const tris = obj.triangles || [];
    return (
      <div key={`tg-${field.accessor}`} className="ad-tri-group full">
        <div className="ad-tri-group-head">
          <span className="ad-tri-group-label">{field.label}</span>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--brand,#1f3a2e)', color: '#fff', border: 'none', fontSize: 12 }}
            onClick={() => setAreaCalcCtx({ property: item, type: field.calcType })}
          >
            {tris.length > 0 ? '✏ Recalculate' : '⊞ Calculate'}
          </button>
        </div>
        {tris.length > 0 ? (
          <>
            {(() => {
              const triUnitLabel = obj.unit === 'Meter' ? 'm' : obj.unit === 'Feet' ? 'ft' : obj.unit === 'Centimeter' ? 'cm' : 'ft';
              const primaryTotal = obj.unit === 'Meter'
                ? `${obj.total_sqm} m²`
                : obj.unit === 'Centimeter'
                ? `${obj.total_sqm} m²`
                : `${obj.total_sqft} sqft`;
              return (
                <>
                  <table className="ad-tri-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>a ({triUnitLabel})</th>
                        <th>b ({triUnitLabel})</th>
                        <th>c ({triUnitLabel})</th>
                        <th>s ({triUnitLabel})</th>
                        <th>Sqft</th>
                        <th>Aana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tris.map((t, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{t.side_a}</td><td>{t.side_b}</td><td>{t.side_c}</td>
                          <td>{t.semi_perimeter}</td>
                          <td>{t.area_sqft}</td><td>{t.aana}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5}><strong>Total</strong></td>
                        <td><strong>{obj.total_sqft}</strong></td>
                        <td><strong>{obj.total_aana}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="ad-tri-summary">
                    {primaryTotal} · {obj.total_sqm} m² · R-A-P-D: {obj.rapd}
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          <p className="ad-tri-empty">No triangles calculated yet.</p>
        )}
      </div>
    );
  };

  const renderFieldGrid = (fieldDefs, itemId, isEditingItem, data, item) => {
    const isGrouped = fieldDefs.length > 0 && 'fields' in fieldDefs[0];
    const renderOneField = field => {
      if (field.type === 'triangle_group') {
        return renderTriangleGroup(field, data[field.accessor], item);
      }
      if (field.type === 'area_sq') {
        const { value: displayValue, unit: unitSuffix } = fmtAreaByUnit(
          data[field.accessor],
          data.area_unit || 'sqm',
          field.sqftSource ? data[field.sqftSource] : null
        );
        return (
          <div key={`${itemId}-${field.accessor}`} className="ad-field">
            <label>{field.label} ({unitSuffix}){field.np && <span className="ad-field-np">{field.np}</span>}</label>
            {isEditingItem
              ? renderObjectFieldInput(field, data[field.accessor])
              : <span>{displayValue}</span>}
          </div>
        );
      }
      return (
        <div key={`${itemId}-${field.accessor}`} className={`ad-field${field.fullWidth ? ' full' : ''}`}>
          <label>{field.label}{field.np && <span className="ad-field-np">{field.np}</span>}</label>
          {isEditingItem
            ? renderObjectFieldInput(field, data[field.accessor])
            : <span>{renderValue(data[field.accessor])}</span>}
        </div>
      );
    };
    if (!isGrouped) return <div className="ad-grid-2">{fieldDefs.map(renderOneField)}</div>;
    return fieldDefs.map(group => (
      <div key={group.title} className="ad-field-group">
        <div className="ad-group-label">{group.title}{group.np && <span className="ad-group-np">{group.np}</span>}</div>
        <div className="ad-grid-2">{group.fields.map(renderOneField)}</div>
      </div>
    ));
  };

  const renderSection = (title, items, fields, headerLabel, getExtraActions, onAdd) => {
    const type = title.toLowerCase();
    return (
      <div>
        <div className="ad-section-head">
          <h3>{title}</h3>
          {onAdd && (
            <button
              className="btn btn-sm"
              style={{ background: 'var(--brand,#1f3a2e)', color: '#fff', border: 'none', display:'flex', alignItems:'center', gap:5 }}
              onClick={onAdd}
            >
              <IconAdd size={14} color="#fff" /> Add {title.slice(0, -1)}
            </button>
          )}
        </div>
        {items && items.length > 0 ? (
          <div className="ad-obj-list">
            {items.map(item => {
              const itemId = item._id || item.id || null;
              const isEditingItem = activeObjectEdit.type === type && activeObjectEdit.id === itemId;
              const data = isEditingItem ? activeObjectEdit.data : item;
              return (
                <div key={itemId || Math.random()} className="ad-obj-card">
                  <div className="ad-obj-head">
                    <strong>{getObjectHeader(item, headerLabel, title.slice(0, -1))}</strong>
                    <div className="ad-obj-actions">
                      {isEditingItem ? (
                        <>
                          <button className="btn btn-sm" onClick={saveObjectEdit}>Save</button>
                          <button className="btn btn-sm btn-secondary" onClick={cancelObjectEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          {getExtraActions && getExtraActions(item)}
                          <button className="btn btn-sm btn-secondary" style={{ display:'flex', alignItems:'center', gap:4 }} onClick={() => startObjectEdit(type, item)}><IconEdit size={13} /> Edit</button>
                        </>
                      )}
                    </div>
                  </div>
                  {renderFieldGrid(fields, itemId, isEditingItem, data, item)}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="ad-empty">No {title.toLowerCase()} found for this account.</p>
        )}
      </div>
    );
  };

  if (loading) return (
    <>
      <div className="topbar">
        <div className="crumbs"><span style={{color:'var(--ink-dim)',cursor:'pointer'}} onClick={() => navigate('/home/accounts')}>Customer Accounts</span><span style={{margin:'0 6px',color:'var(--ink-mute)'}}>/</span><b>Loading…</b></div>
      </div>
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ink-mute)' }}>Loading account details…</div>
    </>
  );

  if (error && !hierarchy) return (
    <>
      <div className="topbar">
        <div className="crumbs"><span style={{color:'var(--ink-dim)',cursor:'pointer'}} onClick={() => navigate('/home/accounts')}>Customer Accounts</span><span style={{margin:'0 6px',color:'var(--ink-mute)'}}>/</span><b>Error</b></div>
        <button className="btn btn-secondary btn-sm" style={{marginLeft:'auto'}} onClick={() => navigate('/home/accounts')}>← Back</button>
      </div>
      <div className="ad-error" style={{marginTop:'24px'}}>⚠ {error}</div>
    </>
  );

  return (
    <div className="page-shell">

      {/* ── Topbar — matches AccountsPage ── */}
      <div className="topbar">
        <div className="crumbs">
          <span style={{color:'var(--ink-dim)',cursor:'pointer'}} onClick={() => navigate('/home/accounts')}>Customer Accounts</span>
          <span style={{margin:'0 6px',color:'var(--ink-mute)'}}>/</span>
          <b>{formData.account_name || 'Account Details'}</b>
          {formData.status && (
            <>
              <span style={{margin:'0 6px',color:'var(--ink-mute)'}}>/</span>
              <span className={`pill ${pillClass(formData.status)}`}>{formData.status}</span>
            </>
          )}
        </div>
        <div className="right">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/home/accounts')}>← Back</button>
          {isEditing ? (
            <>
              <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
              <button className="btn" onClick={handleSave}>Save Changes</button>
            </>
          ) : (
            <button className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:5 }} onClick={() => setIsEditing(true)}><IconEdit size={14} /> Edit</button>
          )}
          <button className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:5 }} onClick={() => setIsUploadModalOpen(true)}><IconUpload size={14} /> Upload Document</button>
          <button className="btn" onClick={() => setIsDocModalOpen(true)}>⎙ Generate Document</button>
        </div>
      </div> 

      {/* ── Stage Path ── */}
      <div style={{ marginTop: '20px' }}>
        <AccountStagePath
          currentStatus={formData.status}
          changelog={changelog}
          onStatusChange={handleStageChange}
          saving={stageSaving}
        />
      </div>

      {/* ── Main layout ── */}
      <div className="layout" style={{ marginTop: '18px' }}>
        <div className="stack">

          {/* Account Info */}
          <div className="panel ad-panel">
            <div className="ad-section-head">
              <h3>Account Information</h3>
              <div className="ad-obj-actions">
                {isEditing ? (
                  <>
                    <button className="btn btn-sm" onClick={handleSave}>Save</button>
                    <button className="btn btn-sm btn-secondary" onClick={handleCancel}>Cancel</button>
                  </>
                ) : (
                  <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(true)}>✏ Edit</button>
                )}
              </div>
            </div>
            <div className="ad-grid-2">
              {accountFields.map(field => (
                <div key={field.accessor} className={`ad-field${field.fullWidth ? ' full' : ''}`}>
                  <label>{field.label}{field.np && <span className="ad-field-np">{field.np}</span>}</label>
                  {isEditing
                    ? renderFieldInput(field)
                    : <span>{renderValue(formData[field.accessor])}</span>}
                </div>
              ))}
            </div>
            <div className="ad-meta">
              {[
                { label: 'Created By', val: renderValue(formData.created_by_name || formData.created_by) },
                { label: 'Created At', val: formatDate(formData.created_at) },
                { label: 'Updated At', val: formatDate(formData.updated_at) },
              ].map(m => (
                <div key={m.label} className="ad-meta-item">
                  <span>{m.label}</span>
                  <strong>{m.val}</strong>
                </div>
              ))}
            </div>
            {error && <div className="ad-error">⚠ {error}</div>}
          </div>

          {/* Clients */}
          <div className="panel ad-panel">
            {renderSection('Clients', hierarchy.clients, clientFields, 'first_name', null, () => setAddModal('client'))}
          </div>

          {/* Properties */}
          <div className="panel ad-panel">
            {renderSection('Properties', hierarchy.properties, propertyFields, 'property_name',
              item => (
                <>
                  <button
                    key="map"
                    className="btn btn-sm"
                    style={{ background: 'rgba(31,58,46,0.08)', color: 'var(--brand,#1f3a2e)', border: 'none' }}
                    onClick={() => setMapProperty(item)}
                  >
                    📍 Map
                  </button>
                </>
              ),
              () => setAddModal('property')
            )}
          </div>

          {/* Owners */}
          <div className="panel ad-panel">
            {renderSection('Owners', hierarchy.owners, ownerFields, 'owner_name', null, () => setAddModal('owner'))}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="stack">
          <div className="panel">
            <div className="panel-head"><h3>Account Summary</h3></div>
            <div className="activity">
              {[
                { cls: '',     label: formData.account_name || '—', note: 'Account name' },
                { cls: 'ok',   label: `${hierarchy.clients?.length ?? 0} Clients`,     note: 'On this account' },
                { cls: 'info', label: `${hierarchy.properties?.length ?? 0} Properties`, note: 'Linked' },
                { cls: '',     label: `${hierarchy.owners?.length ?? 0} Owners`,        note: 'Registered' },
              ].map(row => (
                <div key={row.note} className={`act${row.cls ? ' ' + row.cls : ''}`}>
                  <div className="swatch" />
                  <div className="body"><b>{row.label}</b><small>{row.note}</small></div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Quick Info</h3></div>
            <div className="ad-info-rows">
              {[
                { label: 'Status',   val: formData.status || '—' },
                { label: 'Tax ID',   val: renderValue(formData.tax_id) },
                { label: 'District', val: renderValue(formData.district) },
                { label: 'Country',  val: renderValue(formData.country) },
                { label: 'Created', val: formatDate(formData.created_at) },
                { label: 'Updated', val: formatDate(formData.updated_at) },
              ].map(row => (
                <div key={row.label} className="ad-info-row">
                  <span>{row.label}</span>
                  <strong>{row.val}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h3>Documents {sidebarDocs.length > 0 && <span style={{ background:'#1f3a2e', color:'#fff', borderRadius:'10px', padding:'1px 7px', fontSize:'11px', fontWeight:600, marginLeft:6 }}>{sidebarDocs.length}</span>}</h3>
              <button
                style={{ display:'flex', alignItems:'center', gap:4, fontSize:'11px', padding:'3px 10px', borderRadius:'6px', border:'1px solid #ddd', background:'none', cursor:'pointer', color:'#555' }}
                onClick={() => setIsUploadModalOpen(true)}
              ><IconUpload size={12} /> Upload</button>
            </div>
            <div className="activity">
              {sidebarDocs.length === 0 ? (
                <div className="act">
                  <div className="swatch" />
                  <div className="body"><b>No documents</b><small>Upload files to this account</small></div>
                </div>
              ) : sidebarDocs.slice(0, 6).map(doc => {
                const token = localStorage.getItem('authToken');
                const ext = (doc.file_ext || '').toLowerCase();
                const icon = ['jpg','jpeg','png','tiff','tif'].includes(ext) ? '🖼' : ext === 'pdf' ? '📄' : ['doc','docx'].includes(ext) ? '📝' : ['xls','xlsx'].includes(ext) ? '📊' : '📎';
                const BASE = `http://localhost:5001/api/accounts/${accountId}/documents/${doc._id}`;
                return (
                  <div key={doc._id} className="act" style={{ flexDirection:'column', alignItems:'flex-start', gap:4, padding:'8px 0' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, width:'100%', minWidth:0 }}>
                      <div className="swatch" style={{ flexShrink:0 }} />
                      <span title={doc.original_name} style={{ fontSize:'12px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, minWidth:0 }}>
                        {icon} {doc.original_name}
                      </span>
                    </div>
                    {doc.description && (
                      <span title={doc.description} style={{ fontSize:'11px', color:'#888', paddingLeft:22, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%', display:'block' }}>
                        {doc.description}
                      </span>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:6, paddingLeft:22, flexWrap:'wrap' }}>
                      <span style={{ background:'#e8f0ec', color:'#1f3a2e', borderRadius:'4px', padding:'1px 5px', fontSize:'10px', fontWeight:600, textTransform:'capitalize' }}>
                        {doc.doc_type?.replace(/_/g,' ')}
                      </span>
                      <a href={`${BASE}/view?token=${token}`} target="_blank" rel="noreferrer"
                        title="View" style={{ color:'#555', display:'flex', alignItems:'center' }}><IconView size={14} /></a>
                      <a href={`${BASE}/download?token=${token}`}
                        title="Download" style={{ color:'#555', display:'flex', alignItems:'center' }}><IconDownload size={14} /></a>
                      <button onClick={() => setDocToDelete(doc)} title="Delete"
                        style={{ background:'none', border:'none', color:'#c44', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}><IconDelete size={14} /></button>
                    </div>
                  </div>
                );
              })}
              {sidebarDocs.length > 6 && (
                <div className="act" style={{ cursor:'pointer' }} onClick={() => setIsUploadModalOpen(true)}>
                  <div className="swatch" />
                  <div className="body"><small style={{ color:'#1f3a2e', fontWeight:600 }}>View all {sidebarDocs.length} documents →</small></div>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Recent Activity</h3></div>
            <div className="activity">
              {changelog.length > 0 ? changelog.map((log, idx) => {
                const actor = log.changed_by_name || log.changed_by || 'System';
                const acctName = log.account_name || formData.account_name || 'this account';
                const isCreation = !log.old_status;

                const title = isCreation
                  ? `An account for ${acctName} has been added by ${actor}`
                  : `${actor} changed status to ${log.new_status}`;

                const subtitle = isCreation
                  ? `Status of the account is ${log.new_status}`
                  : `Previous status was ${log.old_status}`;

                return (
                  <div key={idx} className={`act ${pillClass(log.new_status)}`}>
                    <div className="swatch" />
                    <div className="body">
                      <b>{title}</b>
                      <small style={{display:'flex',flexDirection:'column',gap:'2px',marginTop:'3px'}}>
                        <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <span className={`pill ${pillClass(log.new_status)}`}
                            style={{padding:'2px 8px',fontSize:'10px',display:'inline-flex'}}>
                            {log.new_status}
                          </span>
                          <span style={{color:'var(--ink-mute)'}}>{subtitle}</span>
                        </span>
                        <span style={{color:'var(--ink-mute)',fontSize:'11px'}}>
                          {formatDate(log.changed_at)}
                        </span>
                      </small>
                    </div>
                  </div>
                );
              }) : (
                <div className="act">
                  <div className="swatch" />
                  <div className="body">
                    <b>No activity yet</b>
                    <small>Status changes will appear here</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <GenerateDocModal
        accountId={accountId}
        accountName={formData.account_name || 'Account'}
        hierarchy={hierarchy}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); fetchSidebarDocs(); }}
        accountId={accountId}
        accountName={formData.account_name || 'Account'}
      />

      <ConfirmModal
        isOpen={!!docToDelete}
        title="Remove document record"
        message={`Remove "${docToDelete?.original_name}" from this account? The file will remain in storage but the record will be deleted.`}
        confirmLabel="Delete record"
        variant="danger"
        onConfirm={async () => {
          const token = localStorage.getItem('authToken');
          await fetch(`http://localhost:5001/api/accounts/${accountId}/documents/${docToDelete._id}?meta_only=true`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
          });
          setSidebarDocs(prev => prev.filter(d => d._id !== docToDelete._id));
          setDocToDelete(null);
        }}
        onCancel={() => setDocToDelete(null)}
      />

      <AreaCalculatorModal
        key={areaCalcCtx ? `${areaCalcCtx.property?._id || 'p'}-${areaCalcCtx.type}` : 'closed'}
        isOpen={!!areaCalcCtx}
        onClose={() => setAreaCalcCtx(null)}
        asDrawer
        drawerTitle={
          areaCalcCtx?.type === 'measurement' ? 'Measurement Area (नापी)' :
          areaCalcCtx?.type === 'lalpurja'    ? 'Lalpurja Area (लालपुर्जा)' :
          'Area After Deduction'
        }
        accountData={areaCalcCtx?.property || null}
        initialAreaData={
          areaCalcCtx?.type === 'measurement' ? (areaCalcCtx.property?.land_area_as_per_measurement || null) :
          areaCalcCtx?.type === 'lalpurja'    ? (areaCalcCtx.property?.land_area_as_per_lalpurja    || null) :
          areaCalcCtx?.type === 'deduction'   ? (areaCalcCtx.property?.land_area_after_deduction    || null) : null
        }
        onSave={async ({ land_area, triangles, total_sqft, total_sqm, total_aana, rapd, unit, area_unit }) => {
          if (!areaCalcCtx) return;
          const { property, type } = areaCalcCtx;
          const propId = property._id || property.id;
          const structured = { triangles: triangles || [], total_sqft: total_sqft || '', total_sqm: total_sqm || land_area || '', total_aana: total_aana || '', rapd: rapd || '', unit: unit || 'Feet' };
          const patch = { ...property };
          if (area_unit) patch.area_unit = area_unit;
          if (type === 'measurement') {
            patch.land_area_as_per_measurement = structured;
            patch.land_area_measured = land_area;
            patch.land_area_meas_trad = rapd || '';
          } else if (type === 'lalpurja') {
            patch.land_area_as_per_lalpurja = structured;
            patch.land_area_lorc = land_area;
            patch.land_area_lorc_trad = rapd || '';
          } else if (type === 'deduction') {
            patch.land_area_after_deduction = structured;
            patch.land_area_deducted = land_area;
            patch.land_area_ded_trad = rapd || '';
            patch.considered_area = land_area;
          }
          try {
            const res = await accountApi.updateProperty(propId, patch);
            if (res.data?.success) {
              setHierarchy(prev => ({
                ...prev,
                properties: prev.properties.map(p =>
                  (p._id || p.id) === propId ? res.data.data : p
                ),
              }));
              toast('Area saved to property');
              setAreaCalcCtx(null);
            }
          } catch {
            toast('Failed to save area');
          }
        }}
      />

      <AddToAccountModal
        type={addModal}
        accountId={accountId}
        existingClients={hierarchy?.clients || []}
        existingOwners={hierarchy?.owners || []}
        existingProperties={hierarchy?.properties || []}
        isOpen={!!addModal}
        onClose={() => setAddModal(null)}
        onSaved={() => {
          setAddModal(null);
          accountApi.getAccountHierarchy(accountId).then(res => {
            if (res.data?.success) {
              setHierarchy(res.data.data);
              setFormData(res.data.data.account || {});
            }
          });
        }}
      />

      {mapProperty && (
        <PropertyMapModal
          property={mapProperty}
          onClose={() => setMapProperty(null)}
          onPropertyUpdate={(updated) => {
            setMapProperty(updated);
            setHierarchy(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                properties: prev.properties.map(p =>
                  (p._id || p.id) === (updated._id || updated.id) ? updated : p
                ),
              };
            });
          }}
        />
      )}
    </div>
  );
}

export default AccountDetail;
