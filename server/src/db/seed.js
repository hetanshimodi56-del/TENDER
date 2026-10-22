const bcrypt = require('bcryptjs');
const db = require('./db');

function seedDatabase() {
  console.log('Seeding AI E-Tender Platform database...');
  db.reset();

  const passwordHash = bcrypt.hashSync('Password@123', 10);

  // 1. Organizations
  const orgGUDM = db.insert('organizations', {
    id: 'org_gudm',
    name: 'Gujarat Urban Development Mission (GUDM)',
    type: 'Government Department',
    registration_number: 'GOV-GUJ-UDM-2018',
    state: 'Gujarat',
    city: 'Gandhinagar',
    verified: true
  });

  const orgAIIMS = db.insert('organizations', {
    id: 'org_aiims',
    name: 'All India Institute of Medical Sciences (AIIMS)',
    type: 'Autonomous PSU / Healthcare',
    registration_number: 'AUT-AIIMS-DEL-1956',
    state: 'Delhi',
    city: 'New Delhi',
    verified: true
  });

  const orgNHAI = db.insert('organizations', {
    id: 'org_nhai',
    name: 'National Highways Authority of India (NHAI)',
    type: 'Central Public Sector Enterprise',
    registration_number: 'CPSE-NHAI-1988',
    state: 'Delhi',
    city: 'New Delhi',
    verified: true
  });

  const orgBEL = db.insert('organizations', {
    id: 'org_bel',
    name: 'Bharat Electronics Limited (BEL)',
    type: 'Navratna Defence PSU',
    registration_number: 'PSU-BEL-BLR-1954',
    state: 'Karnataka',
    city: 'Bengaluru',
    verified: true
  });

  const orgSECI = db.insert('organizations', {
    id: 'org_seci',
    name: 'Solar Energy Corporation of India (SECI)',
    type: 'CPSU Renewable Energy',
    registration_number: 'CPSU-SECI-2011',
    state: 'Delhi',
    city: 'New Delhi',
    verified: true
  });

  const orgReBIT = db.insert('organizations', {
    id: 'org_rebit',
    name: 'Reserve Bank Information Technology (ReBIT)',
    type: 'Subsidiary of RBI',
    registration_number: 'RBI-REBIT-MUM-2016',
    state: 'Maharashtra',
    city: 'Navi Mumbai',
    verified: true
  });

  // 1. Roles & Permissions (Relational RBAC Structure)
  const roleAdmin = db.insert('roles', { id: 'rol_admin', name: 'Super Admin', description: 'Full system access & platform governance' });
  const roleAuthority = db.insert('roles', { id: 'rol_authority', name: 'Tender Authority / Department Head', description: 'Department-level tender management & bid evaluation' });
  const roleCompany = db.insert('roles', { id: 'rol_company', name: 'Company / Bidder', description: 'Tender discovery, bid submission & document vault' });
  const roleEvaluator = db.insert('roles', { id: 'rol_evaluator', name: 'Technical Evaluator', description: 'Technical scoring & tender evaluation' });
  const roleViewer = db.insert('roles', { id: 'rol_viewer', name: 'Viewer', description: 'Public citizen tender search & document viewing' });

  // Permissions
  const permissionsList = [
    { id: 'perm_manage_users', permission_name: 'manage_users' },
    { id: 'perm_manage_roles', permission_name: 'manage_roles' },
    { id: 'perm_manage_companies', permission_name: 'manage_companies' },
    { id: 'perm_manage_authorities', permission_name: 'manage_authorities' },
    { id: 'perm_create_tenders', permission_name: 'create_tenders' },
    { id: 'perm_edit_tenders', permission_name: 'edit_tenders' },
    { id: 'perm_publish_tenders', permission_name: 'publish_tenders' },
    { id: 'perm_close_tenders', permission_name: 'close_tenders' },
    { id: 'perm_extend_deadlines', permission_name: 'extend_deadlines' },
    { id: 'perm_view_all_tenders', permission_name: 'view_all_tenders' },
    { id: 'perm_view_dept_tenders', permission_name: 'view_dept_tenders' },
    { id: 'perm_view_all_bids', permission_name: 'view_all_bids' },
    { id: 'perm_view_dept_bids', permission_name: 'view_dept_bids' },
    { id: 'perm_submit_bids', permission_name: 'submit_bids' },
    { id: 'perm_view_own_bids', permission_name: 'view_own_bids' },
    { id: 'perm_manage_documents', permission_name: 'manage_documents' },
    { id: 'perm_view_public_tenders', permission_name: 'view_public_tenders' },
    { id: 'perm_download_public_docs', permission_name: 'download_public_docs' },
    { id: 'perm_audit_logs', permission_name: 'audit_logs' },
    { id: 'perm_system_settings', permission_name: 'system_settings' },
    { id: 'perm_view_reports', permission_name: 'view_reports' },
    { id: 'perm_view_analytics', permission_name: 'view_analytics' }
  ];
  permissionsList.forEach(p => db.insert('permissions', p));

  // Role Permissions Mapping
  // Super Admin: All permissions
  permissionsList.forEach(p => {
    db.insert('role_permissions', { role_id: roleAdmin.id, permission_id: p.id });
  });

  // Tender Authority permissions
  [
    'perm_create_tenders', 'perm_edit_tenders', 'perm_publish_tenders', 'perm_close_tenders',
    'perm_extend_deadlines', 'perm_view_dept_tenders', 'perm_view_dept_bids', 'perm_manage_documents',
    'perm_view_reports', 'perm_view_public_tenders', 'perm_download_public_docs'
  ].forEach(pid => db.insert('role_permissions', { role_id: roleAuthority.id, permission_id: pid }));

  // Company / Bidder permissions
  [
    'perm_submit_bids', 'perm_view_own_bids', 'perm_manage_documents', 'perm_view_public_tenders',
    'perm_download_public_docs'
  ].forEach(pid => db.insert('role_permissions', { role_id: roleCompany.id, permission_id: pid }));

  // Evaluator permissions
  [
    'perm_view_dept_bids', 'perm_view_reports', 'perm_view_public_tenders'
  ].forEach(pid => db.insert('role_permissions', { role_id: roleEvaluator.id, permission_id: pid }));

  // Viewer permissions
  [
    'perm_view_public_tenders', 'perm_download_public_docs'
  ].forEach(pid => db.insert('role_permissions', { role_id: roleViewer.id, permission_id: pid }));

  // 1b. Departments
  const deptUrban = db.insert('departments', { id: 'dept_urban', department_name: 'Urban Development Mission (GUDM)', code: 'GUDM' });
  const deptHealth = db.insert('departments', { id: 'dept_health', department_name: 'Healthcare & Medical Supplies (AIIMS)', code: 'AIIMS' });
  const deptPWD = db.insert('departments', { id: 'dept_pwd', department_name: 'Public Works Department (PWD)', code: 'PWD' });
  const deptIT = db.insert('departments', { id: 'dept_it', department_name: 'Information Technology & Cyber (ReBIT)', code: 'REBIT' });
  const deptEnergy = db.insert('departments', { id: 'dept_energy', department_name: 'Renewable Energy & Power (SECI)', code: 'SECI' });
  const deptEducation = db.insert('departments', { id: 'dept_education', department_name: 'Higher Education & Infrastructure', code: 'EDU' });

  // 2. Users with Unique Formatted User IDs
  const userAdmin = db.insert('users', {
    id: 'usr_admin',
    user_id: 'ADM001',
    name: 'Vikramaditya Sharma (Super Admin)',
    email: 'admin@etender.gov.in',
    password_hash: passwordHash,
    role: 'super_admin',
    role_id: roleAdmin.id,
    department_id: null,
    phone: '+91 9876543210',
    status: 'active',
    is_active: true,
    organization_id: null
  });

  const userAuthority = db.insert('users', {
    id: 'usr_authority',
    user_id: 'AUTH001',
    name: 'Dr. Rajeshwari Patel (Tender Authority)',
    email: 'authority@gudm.gov.in',
    password_hash: passwordHash,
    role: 'tender_authority',
    role_id: roleAuthority.id,
    department_id: deptUrban.id,
    phone: '+91 9876543211',
    status: 'active',
    is_active: true,
    organization_id: orgGUDM.id
  });

  const userAuthorityPWD = db.insert('users', {
    id: 'usr_authority_pwd',
    user_id: 'AUTH002',
    name: 'Er. Mahendra Chokshi (PWD Department Head)',
    email: 'pwd.authority@etender.gov.in',
    password_hash: passwordHash,
    role: 'tender_authority',
    role_id: roleAuthority.id,
    department_id: deptPWD.id,
    phone: '+91 9876543215',
    status: 'active',
    is_active: true,
    organization_id: orgNHAI.id
  });

  const userCompany = db.insert('users', {
    id: 'usr_company',
    user_id: 'BID001',
    name: 'Aarav Mehta (Director, TechInfra Solutions)',
    email: 'aarav@techinfra.com',
    password_hash: passwordHash,
    role: 'company_user',
    role_id: roleCompany.id,
    department_id: null,
    phone: '+91 9876543212',
    status: 'active',
    is_active: true,
    organization_id: null
  });

  const userCompany2 = db.insert('users', {
    id: 'usr_company2',
    user_id: 'BID002',
    name: 'Rajesh Singhania (BuildCon Ltd)',
    email: 'bidder2@buildcon.com',
    password_hash: passwordHash,
    role: 'company_user',
    role_id: roleCompany.id,
    department_id: null,
    phone: '+91 9876543216',
    status: 'active',
    is_active: true,
    organization_id: null
  });

  const userEvaluator = db.insert('users', {
    id: 'usr_evaluator',
    user_id: 'EVAL001',
    name: 'Prof. S. N. Bannerjee (Technical Evaluator)',
    email: 'evaluator@etender.gov.in',
    password_hash: passwordHash,
    role: 'evaluator',
    role_id: roleEvaluator.id,
    department_id: deptUrban.id,
    phone: '+91 9876543213',
    status: 'active',
    is_active: true,
    organization_id: null
  });

  const userViewer = db.insert('users', {
    id: 'usr_viewer',
    user_id: 'VIEW001',
    name: 'Pooja Verma (Public Viewer)',
    email: 'viewer@etender.gov.in',
    password_hash: passwordHash,
    role: 'viewer',
    role_id: roleViewer.id,
    department_id: null,
    phone: '+91 9876543214',
    status: 'active',
    is_active: true,
    organization_id: null
  });

  // 3. Tender Authorities Link
  db.insert('tender_authorities', {
    id: 'auth_gudm_1',
    user_id: userAuthority.id,
    organization_id: orgGUDM.id,
    department_id: deptUrban.id,
    designation: 'Chief Procurement & Technical Officer',
    approval_status: 'approved',
    approved_by: userAdmin.id,
    approved_at: new Date(Date.now() - 30 * 86400000).toISOString()
  });

  db.insert('tender_authorities', {
    id: 'auth_pwd_1',
    user_id: userAuthorityPWD.id,
    organization_id: orgNHAI.id,
    department_id: deptPWD.id,
    designation: 'Executive Engineer & Department Head',
    approval_status: 'approved',
    approved_by: userAdmin.id,
    approved_at: new Date(Date.now() - 25 * 86400000).toISOString()
  });

  // 4. Companies Table (Section 13)
  const compTechInfra = db.insert('companies', {
    id: 'comp_techinfra',
    user_id: userCompany.user_id,
    company_name: 'TechInfra Smart Systems Pvt Ltd',
    registration_number: 'U72900GJ2016PTC089761',
    GST_number: '24AAACT1234F1Z8',
    address: 'Plot 42, Infocity Gandhinagar, Gujarat - 382007',
    experience: '8 Years in Smart Cities, Public Infrastructure & AI-driven surveillance',
    verification_status: 'approved'
  });

  const compBuildCon = db.insert('companies', {
    id: 'comp_buildcon',
    user_id: userCompany2.user_id,
    company_name: 'BuildCon Infrastructure Ltd',
    registration_number: 'U45200MH2012PLC123456',
    GST_number: '27AABCB9876K1Z2',
    address: 'Nariman Point, Mumbai - 400021',
    experience: '12 Years in Highways, Bridges & Heavy Civil Works',
    verification_status: 'approved'
  });

  // 4b. Company Profile for Demo Bidder
  db.insert('company_profiles', {
    id: 'prof_techinfra',
    user_id: userCompany.id,
    company_name: 'TechInfra Smart Systems Pvt Ltd',
    pan_number: 'AAACT1234F',
    gst_number: '24AAACT1234F1Z8',
    annual_turnover: 550000000, // 55 Crores INR
    years_of_experience: 8,
    certifications: ['ISO 9001:2015', 'ISO 27001:2022', 'CMMI Level 3', 'MSME Registered'],
    state: 'Gujarat',
    city: 'Ahmedabad',
    industry_sectors: ['Information Technology', 'Smart City Solutions', 'IoT & Surveillance', 'Cloud Infrastructure'],
    core_capabilities: [
      'Intelligent Traffic Systems',
      'AI Video Analytics',
      'Cloud ERP Implementation',
      'SCADA & Command Control Centers',
      'Cybersecurity Audits'
    ],
    verified: true
  });

  // 5. User Preferences for Demo Bidder
  db.insert('user_preferences', {
    id: 'pref_techinfra',
    user_id: userCompany.id,
    categories: ['Information Technology', 'Smart City & IoT', 'Electronics & Instrumentation', 'Telecommunications'],
    locations: ['Gujarat', 'Maharashtra', 'Delhi', 'Karnataka'],
    min_value: 50000000, // 5 Cr
    max_value: 800000000, // 80 Cr
    keywords: ['Traffic Management', 'Cloud ERP', 'CCTV Surveillance', 'AI Analytics', 'IoT Sensors', 'Command Center'],
    max_deadline_days: 45,
    alert_email_enabled: true,
    alert_in_app_enabled: true
  });

  // Helper date generators
  const now = new Date();
  const addDays = (d, days) => new Date(d.getTime() + days * 86400000).toISOString();
  const subDays = (d, days) => new Date(d.getTime() - days * 86400000).toISOString();

  // 6. Comprehensive Realistic Tenders
  const tender1 = db.insert('tenders', {
    id: 'tnd_itms_001',
    tender_reference_no: 'GUDM/ITMS/2026/04',
    title: 'Implementation of Intelligent Traffic Management System (ITMS) with AI Video Analytics for Ahmedabad Smart City',
    description: 'Design, supply, installation, testing, commissioning and 5-year maintenance of Adaptive Traffic Control System (ATCS), Red Light Violation Detection (RLVD), Automatic Number Plate Recognition (ANPR), and integrated Command & Control Center (ICCC) for 180 intersections.',
    organization_id: orgGUDM.id,
    organization_name: orgGUDM.name,
    category: 'Information Technology',
    industry: 'Smart City & IoT',
    location_state: 'Gujarat',
    location_city: 'Ahmedabad',
    estimated_value: 450000000, // 45 Cr
    emd_amount: 9000000, // 90 Lakhs (2%)
    tender_fee: 25000,
    published_date: subDays(now, 10),
    closing_date: addDays(now, 18),
    opening_date: addDays(now, 19),
    status: 'published',
    min_turnover_required: 300000000, // 30 Cr
    min_experience_years: 5,
    required_certifications: ['ISO 9001:2015', 'ISO 27001:2022', 'CMMI Level 3'],
    required_documents: [
      'Technical Proposal (Section 1 to 5)',
      'Audited Balance Sheets of last 3 Financial Years',
      'Earnest Money Deposit (EMD) Bank Guarantee',
      'OEM Authorization Form for High-Resolution ANPR Cameras',
      'Client Completion Certificate for at least 1 Smart City ITMS project (> ₹20 Cr)',
      'GST Registration Certificate & Valid PAN Card'
    ],
    clauses_summary: [
      'Liquidated Damages: 0.5% per week of delay up to a ceiling of 10% total contract value.',
      'Performance Security: 5% of total contract value via irrevocable Bank Guarantee valid for 60 months.',
      'Payment Milestone: 20% on delivery of hardware, 40% on installation & testing, 20% on ICCC integration & Go-Live, 20% in quarterly O&M tranches.',
      'Joint Ventures: Allowed up to maximum 2 partners; lead partner must possess at least 51% equity.'
    ],
    bidder_checklist: [
      { item: 'Verify minimum average annual turnover of ₹30 Cr over last 3 years', required: true },
      { item: 'Submit Bank Guarantee of ₹90 Lakhs valid for 180 days from tender due date', required: true },
      { item: 'Furnish ISO 9001:2015 & ISO 27001:2022 valid certificates', required: true },
      { item: 'Attach CMMI Level 3 (or higher) appraisal certificate', required: true },
      { item: 'Provide power of attorney for authorized signatory', required: true },
      { item: 'Sign and stamp non-disclosure agreement (Annexure IV)', required: true }
    ],
    document_text: `GOVERNMENT OF GUJARAT - GUJARAT URBAN DEVELOPMENT MISSION (GUDM)
Tender Notification No: GUDM/ITMS/2026/04.
Project: Turnkey Implementation of Intelligent Traffic Management System (ITMS) with AI Video Analytics for Ahmedabad Smart City Phase II.
Estimated Cost: INR 45,00,00,000/- (Rupees Forty-Five Crores).
EMD: INR 90,00,000/-. Tender Fee: INR 25,000/- non-refundable.
Key Eligibility:
1. Bidder must be an Indian entity registered under Companies Act.
2. Minimum average turnover of INR 30 Crores in preceding 3 financial years.
3. Minimum 5 years of proven experience in IT infrastructure / smart surveillance.
4. Mandatory Certifications: ISO 9001:2015, ISO 27001:2022, CMMI Dev Level 3.
5. Bidder must have executed at least 1 similar ITMS/ATCS project valued at not less than INR 20 Crores.
Submission Deadline: Complete technical and financial proposals must be submitted online before 18:00 hours IST on the closing date.`,
    created_by: userAuthority.id,
    published_by: userAuthority.id
  });

  const tender2 = db.insert('tenders', {
    id: 'tnd_aiims_002',
    tender_reference_no: 'AIIMS/DEL/BME/2026/11',
    title: 'Procurement, Installation and Comprehensive Maintenance of 3.0 Tesla High-Field MRI Scanner System',
    description: 'Global tender enquiry for procurement, site preparation, turnkey installation and 10-year Comprehensive Maintenance Contract (CMC) of state-of-the-art 3.0 Tesla Magnetic Resonance Imaging (MRI) system for Dept of Radio-Diagnosis.',
    organization_id: orgAIIMS.id,
    organization_name: orgAIIMS.name,
    category: 'Healthcare & Medical Equipment',
    industry: 'Biomedical & Healthcare',
    location_state: 'Delhi',
    location_city: 'New Delhi',
    estimated_value: 185000000, // 18.5 Cr
    emd_amount: 3700000, // 37 Lakhs
    tender_fee: 15000,
    published_date: subDays(now, 5),
    closing_date: addDays(now, 25),
    opening_date: addDays(now, 26),
    status: 'published',
    min_turnover_required: 150000000, // 15 Cr
    min_experience_years: 7,
    required_certifications: ['ISO 13485:2016', 'US FDA / European CE Approval', 'AERB Safety Clearance'],
    required_documents: [
      'Original Manufacturer Authorization (MAF)',
      'US FDA 510(k) or European CE Certificate',
      'AERB Type Approval Certificate',
      'Performance statement for 5 installations in premier Indian medical institutions',
      'Turnover and Net Worth Certificate issued by Chartered Accountant'
    ],
    clauses_summary: [
      'Uptime Guarantee: Minimum 98% uptime on 24x7 basis. Penalty of ₹10,000 per day for downtime exceeding limits.',
      'Warranty: 5 years comprehensive warranty followed by 5 years mandatory CMC.',
      'Liquidated Damages: 0.5% per week up to 10% maximum.'
    ],
    bidder_checklist: [
      { item: 'Valid AERB and CE / US FDA certification documents', required: true },
      { item: 'EMD proof of ₹37 Lakhs in favor of Director, AIIMS New Delhi', required: true },
      { item: 'Undertaking for 10-year spare parts availability', required: true }
    ],
    document_text: `ALL INDIA INSTITUTE OF MEDICAL SCIENCES (AIIMS), NEW DELHI
Tender Ref: AIIMS/DEL/BME/2026/11.
Supply, Installation & 10-Year CMC of 3.0 Tesla MRI Machine.
Estimated Value: INR 18.5 Crores. EMD: INR 37 Lakhs.
Eligibility: Must be Direct Manufacturer or Authorized Indian Subsidiary. Turnaround time for breakdown call must not exceed 4 hours. ISO 13485 and AERB approval are mandatory.`,
    created_by: userAuthority.id,
    published_by: userAuthority.id
  });

  const tender3 = db.insert('tenders', {
    id: 'tnd_bel_003',
    tender_reference_no: 'BEL/ERP-CLOUD/2026/09',
    title: 'Modernization, Cloud Migration and Managed Services of Enterprise ERP and Hybrid Data Center Infrastructure',
    description: 'Selection of System Integrator for migration of existing SAP ECC to S/4HANA on MeitY-empaneled Tier-III Cloud, disaster recovery setup, DevOps orchestration, and 3-year managed operations support.',
    organization_id: orgBEL.id,
    organization_name: orgBEL.name,
    category: 'Information Technology',
    industry: 'Cloud & Enterprise Software',
    location_state: 'Karnataka',
    location_city: 'Bengaluru',
    estimated_value: 120000000, // 12 Cr
    emd_amount: 2400000, // 24 Lakhs
    tender_fee: 10000,
    published_date: subDays(now, 12),
    closing_date: addDays(now, 14),
    opening_date: addDays(now, 15),
    status: 'published',
    min_turnover_required: 100000000, // 10 Cr
    min_experience_years: 5,
    required_certifications: ['ISO 9001:2015', 'ISO 27001:2022', 'CMMI Level 3', 'MeitY Cloud Partner'],
    required_documents: [
      'SAP Gold/Platinum Partner Accreditation Certificate',
      'MeitY Cloud Service Provider Authorization Agreement',
      'Project completion citations for at least 2 PSU ERP migrations',
      'CVs of Key Technical Personnel (Solutions Architect, SAP Lead)'
    ],
    clauses_summary: [
      'Data Sovereignty: All workloads and backup vaults must strictly reside within Indian territory.',
      'SLA Benchmark: 99.95% system uptime; penalties graded by severity level.'
    ],
    bidder_checklist: [
      { item: 'Attach ISO 27001 & CMMI Level 3 certificates', required: true },
      { item: 'Evidence of 2 completed PSU/Govt ERP implementations', required: true }
    ],
    document_text: `BHARAT ELECTRONICS LIMITED (BEL)
Tender Ref: BEL/ERP-CLOUD/2026/09.
Selection of Cloud System Integrator for SAP Modernization. Estimated Value: INR 12 Crores.
Qualifications: Bidder must have minimum 5 years in ERP cloud deployment. Must possess ISO 27001:2022 and CMMI Level 3.`,
    created_by: userAuthority.id,
    published_by: userAuthority.id
  });

  const tender4 = db.insert('tenders', {
    id: 'tnd_nhai_004',
    tender_reference_no: 'NHAI/ENG/NH48/2026/01',
    title: 'Engineering, Procurement and Construction (EPC) of 4-Lane Elevated Highway Corridor from Vadodara to Bharuch (Package II)',
    description: 'Construction of 28.5 km 4-lane access-controlled elevated corridor on NH-48 including major bridges, interchanges, toll plazas with automatic electronic toll collection (FASTag), and advanced highway traffic management system.',
    organization_id: orgNHAI.id,
    organization_name: orgNHAI.name,
    category: 'Civil Works & Construction',
    industry: 'Infrastructure & Highways',
    location_state: 'Gujarat',
    location_city: 'Vadodara',
    estimated_value: 1200000000, // 120 Cr
    emd_amount: 24000000, // 2.4 Cr
    tender_fee: 50000,
    published_date: subDays(now, 20),
    closing_date: addDays(now, 2), // Closing very soon!
    opening_date: addDays(now, 3),
    status: 'closing_soon',
    min_turnover_required: 800000000, // 80 Cr
    min_experience_years: 10,
    required_certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'OHSAS 18001 / ISO 45001'],
    required_documents: [
      'Class 1 Civil Contractor Registration',
      'Bid Capacity Calculation Sheet certified by Auditor',
      'List of heavy equipment & batching plants owned/leased',
      'Experience certificate of executing at least one 4-lane highway project of length > 20 km'
    ],
    clauses_summary: [
      'Defects Liability Period: 5 years from issuance of Provisional Completion Certificate.',
      'Bonus for early completion: 0.05% of contract price per day ahead of schedule.'
    ],
    bidder_checklist: [
      { item: 'Bid capacity formula validation', required: true },
      { item: 'Bank Guarantee of ₹2.4 Cr', required: true }
    ],
    document_text: `NATIONAL HIGHWAYS AUTHORITY OF INDIA (NHAI)
Tender Notice No: NHAI/ENG/NH48/2026/01.
EPC Contract for 4-Lane Elevated Highway Corridor.
Estimated Value: INR 120 Crores. Completion Period: 30 Months.
Turnover criteria: INR 80 Crores minimum average over 3 financial years.`,
    created_by: userAuthority.id,
    published_by: userAuthority.id
  });

  const tender5 = db.insert('tenders', {
    id: 'tnd_seci_005',
    tender_reference_no: 'SECI/SOLAR/GRID/2026/18',
    title: 'Setting up of 50 MW Grid-Connected Rooftop and Ground-Mounted Solar PV Power Plants in Government Buildings',
    description: 'Design, engineering, supply, erection, testing, commissioning with associated transmission line and 10 years comprehensive Operation & Maintenance (O&M) for 50 MW Solar PV capacity.',
    organization_id: orgSECI.id,
    organization_name: orgSECI.name,
    category: 'Renewable Energy',
    industry: 'Power & Green Energy',
    location_state: 'Rajasthan',
    location_city: 'Jaipur',
    estimated_value: 350000000, // 35 Cr
    emd_amount: 7000000, // 70 Lakhs
    tender_fee: 25000,
    published_date: subDays(now, 8),
    closing_date: addDays(now, 22),
    opening_date: addDays(now, 23),
    status: 'published',
    min_turnover_required: 250000000, // 25 Cr
    min_experience_years: 4,
    required_certifications: ['ISO 9001:2015', 'MNRE Approved Channel Partner', 'ALMM Listed PV Modules'],
    required_documents: [
      'MNRE accreditation letter',
      'ALMM compliance declaration for solar cells and modules',
      'Proof of commissioning at least 15 MW solar PV capacity in India',
      'Solvency certificate from scheduled commercial bank'
    ],
    clauses_summary: [
      'Minimum CUF (Capacity Utilization Factor): 19% guaranteed annual average.',
      'Domestic Content Requirement (DCR): Solar cells and modules must strictly be made in India.'
    ],
    bidder_checklist: [
      { item: 'ALMM & MNRE compliance certificate', required: true },
      { item: 'EMD proof of ₹70 Lakhs', required: true }
    ],
    document_text: `SOLAR ENERGY CORPORATION OF INDIA (SECI)
Tender Ref: SECI/SOLAR/GRID/2026/18.
Setting up 50 MW Grid Connected Solar PV.
Value: INR 35 Crores. EMD: INR 70 Lakhs.
Mandatory compliance with Ministry of New and Renewable Energy (MNRE) guidelines and ALMM list.`,
    created_by: userAuthority.id,
    published_by: userAuthority.id
  });

  const tender6 = db.insert('tenders', {
    id: 'tnd_rebit_006',
    tender_reference_no: 'REBIT/CYBER/SOC/2026/05',
    title: 'Establishment of 24x7 Next-Gen Security Operations Center (SOC), Threat Intelligence & VAPT Services',
    description: 'Provisioning of 24x7 Security Operations Center services, SIEM/SOAR platform integration, Endpoint Detection & Response (EDR), continuous Threat Hunting, Red Teaming, and periodic Vulnerability Assessment & Penetration Testing (VAPT) for banking networks.',
    organization_id: orgReBIT.id,
    organization_name: orgReBIT.name,
    category: 'Information Technology',
    industry: 'Cybersecurity & Financial IT',
    location_state: 'Maharashtra',
    location_city: 'Mumbai',
    estimated_value: 82000000, // 8.2 Cr
    emd_amount: 1640000, // 16.4 Lakhs
    tender_fee: 10000,
    published_date: subDays(now, 15),
    closing_date: addDays(now, 10),
    opening_date: addDays(now, 11),
    status: 'published',
    min_turnover_required: 50000000, // 5 Cr
    min_experience_years: 4,
    required_certifications: ['CERT-In Empaneled', 'ISO 27001:2022', 'CMMI Level 3'],
    required_documents: [
      'Valid CERT-In Empanelment Certificate',
      'ISO 27001:2022 and ISO 22301 Certifications',
      'Profiles of certified analysts (CISSP, CEH, OSCP, CISA)',
      'Reference letters for 3 financial institutions or scheduled commercial banks'
    ],
    clauses_summary: [
      'Strict Non-Disclosure & Background Verification of all deployed security analysts.',
      'Breach Notification SLA: Critical cyber incidents must be contained and alerted within 15 minutes.'
    ],
    bidder_checklist: [
      { item: 'CERT-In active empanelment certificate', required: true },
      { item: 'ISO 27001:2022 certificate copy', required: true },
      { item: 'Bid security of ₹16.4 Lakhs', required: true }
    ],
    document_text: `RESERVE BANK INFORMATION TECHNOLOGY (ReBIT)
Tender Ref: REBIT/CYBER/SOC/2026/05.
Procurement of Next-Gen SOC, Threat Hunting & VAPT Services.
Estimated Budget: INR 8.2 Crores. EMD: INR 16.4 Lakhs.
Mandatory Requirements: The bidder must be an active CERT-In empaneled information security auditing organization. ISO 27001:2022 is compulsory.`,
    created_by: userAuthority.id,
    published_by: userAuthority.id
  });

  const tender7 = db.insert('tenders', {
    id: 'tnd_edu_007',
    tender_reference_no: 'GUJ/EDU/SMARTCLASS/2026/22',
    title: 'Supply and Commissioning of Interactive Flat Panels (IFP), Digital Podium & Smart Classroom Infrastructure for 1,200 Schools',
    description: 'Turnkey supply, wall mounting, power cabling, interactive educational software pre-installation, 3-year warranty and teacher training for 75-inch 4K Interactive Panels across 33 districts of Gujarat.',
    organization_id: orgGUDM.id,
    organization_name: orgGUDM.name,
    category: 'Electronics & Hardware',
    industry: 'Education Technology',
    location_state: 'Gujarat',
    location_city: 'Gandhinagar',
    estimated_value: 45000000, // 4.5 Cr
    emd_amount: 900000, // 9 Lakhs
    tender_fee: 10000,
    published_date: subDays(now, 4),
    closing_date: addDays(now, 26),
    opening_date: addDays(now, 27),
    status: 'published',
    min_turnover_required: 30000000, // 3 Cr
    min_experience_years: 3,
    required_certifications: ['ISO 9001:2015', 'BIS Safety Certification', 'RoHS Compliance'],
    required_documents: [
      'BIS Registration Certificate for interactive panels',
      'OEM authorization and service network across Gujarat districts',
      'Audited balance sheets showing positive net worth',
      'Proof of supplying at least 500 interactive screens to educational bodies'
    ],
    clauses_summary: [
      'Warranty: 36 months comprehensive on-site warranty.',
      'Delivery Timeline: Staggered batch delivery across 60 days.'
    ],
    bidder_checklist: [
      { item: 'BIS certificate for display panels', required: true },
      { item: 'EMD proof of ₹9 Lakhs', required: true }
    ],
    document_text: `DEPARTMENT OF EDUCATION - SAMAGRA SHIKSHA GUJARAT
Tender Notice: GUJ/EDU/SMARTCLASS/2026/22.
Supply of Interactive Flat Panels and Smart Class Equipment for 1,200 Government Schools.
Estimated Cost: INR 4.5 Crores. EMD: INR 9,00,000/-.
OEM authorization and BIS certification are mandatory.`,
    created_by: userAuthority.id,
    published_by: userAuthority.id
  });

  const tender8 = db.insert('tenders', {
    id: 'tnd_hosp_008',
    tender_reference_no: 'GUJ/MED/GAS-MGPS/2026/03',
    title: 'Annual Maintenance and Upgradation of Medical Gas Pipeline System (MGPS) for 1,200-Bed Civil Hospital',
    description: 'Comprehensive maintenance, daily pressure monitoring, manifold operations, oxygen plant integration, and emergency refilling services for Liquid Medical Oxygen (LMO) and medical gases network.',
    organization_id: orgGUDM.id,
    organization_name: orgGUDM.name,
    category: 'Healthcare & Maintenance',
    industry: 'Hospital Infrastructure',
    location_state: 'Gujarat',
    location_city: 'Ahmedabad',
    estimated_value: 18000000, // 1.8 Cr
    emd_amount: 360000, // 3.6 Lakhs
    tender_fee: 5000,
    published_date: subDays(now, 16),
    closing_date: addDays(now, 8),
    opening_date: addDays(now, 9),
    status: 'published',
    min_turnover_required: 15000000, // 1.5 Cr
    min_experience_years: 3,
    required_certifications: ['ISO 13485:2016', 'PESO License for Compressed Gas'],
    required_documents: [
      'PESO (Petroleum and Explosives Safety Organization) License',
      'Staff deployment roster of certified biomedical technicians',
      'Client performance certificates from at least two 500+ bed hospitals'
    ],
    clauses_summary: [
      'Emergency response time within 15 minutes for oxygen pressure drop.',
      'Monthly audit reports submitted to Medical Superintendent.'
    ],
    bidder_checklist: [
      { item: 'Valid PESO authorization', required: true },
      { item: 'EMD deposit ₹3.6 Lakhs', required: true }
    ],
    document_text: `CIVIL HOSPITAL AHMEDABAD & HEALTH AND FAMILY WELFARE DEPT
Tender Ref: GUJ/MED/GAS-MGPS/2026/03.
Comprehensive Maintenance of Medical Gas Pipeline Systems (MGPS).
Estimated Value: INR 1.8 Crores.
Eligibility: Must possess PESO license and ISO 13485. 24x7 on-site emergency personnel mandatory.`,
    created_by: userAuthority.id,
    published_by: userAuthority.id
  });

  // 7. Initial Saved Tenders with Status for Demo Bidder
  db.insert('saved_tenders', {
    id: 'sav_1',
    user_id: userCompany.id,
    tender_id: tender1.id,
    notes: 'Primary opportunity: High match with our smart city IoT & traffic analytics stack. Review EMD guarantee with SBI.',
    is_favourite: true,
    status: 'preparing', // saved, preparing, submitted, under_evaluation, awarded, lost
    bid_amount: 432000000, // 43.2 Cr
    submission_date: null,
    status_history: [
      { status: 'saved', timestamp: subDays(now, 5), note: 'Shortlisted from AI recommendations with 94% match' },
      { status: 'preparing', timestamp: subDays(now, 2), note: 'Consortium formed with Siemens India; drafting technical BOQ' }
    ]
  });

  db.insert('saved_tenders', {
    id: 'sav_2',
    user_id: userCompany.id,
    tender_id: tender3.id,
    notes: 'Good opportunity for our cloud ERP division in Bengaluru.',
    is_favourite: false,
    status: 'submitted',
    bid_amount: 81500000, // 8.15 Cr
    submission_date: subDays(now, 1),
    status_history: [
      { status: 'saved', timestamp: subDays(now, 8), note: 'Tender shortlisted' },
      { status: 'preparing', timestamp: subDays(now, 4), note: 'Prepared technical proposal & CA audited sheets' },
      { status: 'submitted', timestamp: subDays(now, 1), note: 'Bid documents digitally signed and uploaded to CPP Portal' }
    ]
  });

  db.insert('saved_tenders', {
    id: 'sav_3',
    user_id: userCompany.id,
    tender_id: tender6.id,
    notes: 'Cybersecurity SOC tender: Need to confirm CERT-In partnership scope.',
    is_favourite: true,
    status: 'saved',
    bid_amount: null,
    submission_date: null,
    status_history: [
      { status: 'saved', timestamp: subDays(now, 3), note: 'Opportunity discovered via AI high-match filter' }
    ]
  });

  // 7b. Tender Tasks for Bidding Preparation Pipeline
  db.insert('tender_tasks', {
    id: 'tsk_1',
    user_id: userCompany.id,
    tender_id: tender1.id,
    tender_reference_no: 'GUDM/ITMS/2026/04',
    tender_title: 'Intelligent Traffic Management System (ITMS)',
    title: 'Procure Bank Guarantee / EMD ₹90 Lakhs',
    description: 'Coordinate with State Bank of India Commercial Branch for ₹90 Lakhs Bank Guarantee in favor of GUDM Gandhinagar. Check 180-day validity.',
    assigned_to: 'CA Rahul Verma (Finance)',
    priority: 'critical',
    stage: 'Pre-Bid / EMD',
    status: 'in_progress', // todo, in_progress, in_review, completed
    due_date: addDays(now, 4),
    checklist: [
      { id: 'c1', text: 'Obtain sanction letter from SBI', completed: true },
      { id: 'c2', text: 'Verify beneficiary format as per Tender Annexure-IV', completed: true },
      { id: 'c3', text: 'Stamp duty franking of BG document', completed: false }
    ]
  });

  db.insert('tender_tasks', {
    id: 'tsk_2',
    user_id: userCompany.id,
    tender_id: tender1.id,
    tender_reference_no: 'GUDM/ITMS/2026/04',
    tender_title: 'Intelligent Traffic Management System (ITMS)',
    title: 'Draft Technical Architecture & Sensor BOQ',
    description: 'Compile edge computing server specs, ANPR cameras, Radar speed detectors and Command Center LED video wall bill of quantities.',
    assigned_to: 'Rohan Shah (Chief Architect)',
    priority: 'high',
    stage: 'Technical Documentation',
    status: 'completed',
    due_date: subDays(now, 1),
    checklist: [
      { id: 'c4', text: 'Finalize ANPR camera datasheet compliance', completed: true },
      { id: 'c5', text: 'OEM Authorization Letter (MAF) from Cisco & Hikvision', completed: true },
      { id: 'c6', text: 'Network topology and bandwidth calculations', completed: true }
    ]
  });

  db.insert('tender_tasks', {
    id: 'tsk_3',
    user_id: userCompany.id,
    tender_id: tender1.id,
    tender_reference_no: 'GUDM/ITMS/2026/04',
    tender_title: 'Intelligent Traffic Management System (ITMS)',
    title: 'Statutory CA Turnover & Net Worth Certificates',
    description: 'Get last 3 financial years audited balance sheets (FY 2022-23, 2023-24, 2024-25) with UDIN verification from statutory auditor.',
    assigned_to: 'Aarav Mehta (Bid Lead)',
    priority: 'high',
    stage: 'Compliance & Legal',
    status: 'in_review',
    due_date: addDays(now, 3),
    checklist: [
      { id: 'c7', text: 'Turnover certificate stating > ₹150 Cr revenue', completed: true },
      { id: 'c8', text: 'Positive net worth declaration', completed: true },
      { id: 'c9', text: 'CA membership number and UDIN printout', completed: false }
    ]
  });

  db.insert('tender_tasks', {
    id: 'tsk_4',
    user_id: userCompany.id,
    tender_id: tender3.id,
    tender_reference_no: 'BEL/ERP-SEC/2026/02',
    tender_title: 'Enterprise Cloud ERP Implementation & Security Integration',
    title: 'Final Bid Upload & Digital Signing',
    description: 'Verify packet 1 (Technical Bid PDF) and packet 2 (Financial BOQ Excel) hashes before final upload on defence procurement portal.',
    assigned_to: 'Pooja Iyer (Compliance)',
    priority: 'critical',
    stage: 'Submission & Upload',
    status: 'completed',
    due_date: subDays(now, 1),
    checklist: [
      { id: 'c10', text: 'Class-3 Digital Signature token tested', completed: true },
      { id: 'c11', text: 'All tender addenda & corrigenda acknowledged', completed: true },
      { id: 'c12', text: 'Download official submission acknowledgment receipt', completed: true }
    ]
  });

  db.insert('tender_tasks', {
    id: 'tsk_5',
    user_id: userCompany.id,
    tender_id: tender6.id,
    tender_reference_no: 'REBIT/SOC-AI/2026/08',
    tender_title: 'Managed Security Operations Center (SOC) with AI Threat Detection',
    title: 'Review CERT-In & ISO 27001 Compliance Matrix',
    description: 'Map our security tooling against RBI cyber security framework guidelines and check 24x7 SOC staffing roster requirements.',
    assigned_to: 'Kishan Gor (Security Analyst)',
    priority: 'medium',
    stage: 'Technical Documentation',
    status: 'todo',
    due_date: addDays(now, 6),
    checklist: [
      { id: 'c13', text: 'Review RBI CSITE annexures', completed: false },
      { id: 'c14', text: 'Collect SOC analyst CISSP/CEH certifications', completed: false }
    ]
  });

  // 8. Alerts for Demo Bidder
  db.insert('tender_alerts', {
    id: 'alt_1',
    user_id: userCompany.id,
    tender_id: tender1.id,
    alert_type: 'new_match',
    message: 'New 94% Match: Intelligent Traffic Management System (ITMS) published by GUDM.',
    is_read: false,
    created_at: subDays(now, 1)
  });

  db.insert('tender_alerts', {
    id: 'alt_2',
    user_id: userCompany.id,
    tender_id: tender6.id,
    alert_type: 'deadline_10d',
    message: 'Upcoming Deadline: ReBIT Cybersecurity SOC proposal submission closes in 10 days.',
    is_read: false,
    created_at: subDays(now, 2)
  });

  db.insert('tender_alerts', {
    id: 'alt_3',
    user_id: userCompany.id,
    tender_id: tender4.id,
    alert_type: 'deadline_2d',
    message: 'Urgent Deadline: NHAI Vadodara Highway tender closing in 2 days (48 Hours remaining).',
    is_read: true,
    created_at: subDays(now, 3)
  });

  // 9. Initial Bids
  db.insert('bids', {
    id: 'bid_001',
    tender_id: tender1.id,
    tender_reference_no: tender1.tender_reference_no,
    tender_title: tender1.title,
    department: 'Gujarat Urban Development Mission (GUDM)',
    user_id: userCompany.id,
    bidder_name: userCompany.name,
    bidder_email: userCompany.email,
    company_name: 'TechInfra Smart Systems Pvt Ltd',
    bid_amount: 432000000,
    technical_proposal: 'Turnkey Smart ITMS Command & Control Center with 4K ANPR Cameras and Optical Fiber ring topology.',
    commercial_terms: 'Milestone payment per RFP Clause 14: 20% on Delivery, 60% on Commissioning, 20% over 5-year AMC.',
    delivery_timeline_months: 12,
    documents: [
      { name: 'Technical_Bid_Solution_v1.2.pdf', size: '3.4 MB', type: 'application/pdf' },
      { name: 'Commercial_BOQ_Quote.xlsx', size: '540 KB', type: 'application/vnd.ms-excel' },
      { name: 'EMD_Bank_Guarantee_₹90L.pdf', size: '1.2 MB', type: 'application/pdf' }
    ],
    status: 'shortlisted',
    evaluation_score: 94,
    evaluated_by: userAuthority.id,
    evaluated_at: subDays(now, 2),
    submitted_at: subDays(now, 10)
  });

  db.insert('bids', {
    id: 'bid_002',
    tender_id: tender2.id,
    tender_reference_no: tender2.tender_reference_no,
    tender_title: tender2.title,
    department: 'All India Institute of Medical Sciences (AIIMS)',
    user_id: userCompany.id,
    bidder_name: userCompany.name,
    bidder_email: userCompany.email,
    company_name: 'TechInfra Smart Systems Pvt Ltd',
    bid_amount: 118000000,
    technical_proposal: 'Supply and installation of 3T MRI & High-Frequency Digital X-Ray Suites with 10-year comprehensive warranty.',
    commercial_terms: '100% Irrevocable Letter of Credit payable against shipping documents and AERB clearance.',
    delivery_timeline_months: 6,
    documents: [
      { name: 'OEM_Siemens_MAF_Letter.pdf', size: '1.8 MB', type: 'application/pdf' },
      { name: 'Financial_Bid_Schedule.xlsx', size: '420 KB', type: 'application/vnd.ms-excel' }
    ],
    status: 'under_evaluation',
    evaluation_score: 88,
    evaluated_by: userAdmin.id,
    evaluated_at: subDays(now, 1),
    submitted_at: subDays(now, 5)
  });

  db.insert('bids', {
    id: 'bid_003',
    tender_id: tender3.id,
    tender_reference_no: tender3.tender_reference_no,
    tender_title: tender3.title,
    department: 'Bharat Electronics Limited (BEL)',
    user_id: userCompany.id,
    bidder_name: userCompany.name,
    bidder_email: userCompany.email,
    company_name: 'TechInfra Smart Systems Pvt Ltd',
    bid_amount: 86500000,
    technical_proposal: 'Zero-Downtime Multi-AZ Cloud Migration to MeitY empaneled sovereign data center.',
    commercial_terms: 'Monthly OPEX consumption billing with 99.98% SLA credit guarantee.',
    delivery_timeline_months: 9,
    documents: [
      { name: 'Cloud_Architecture_SLA_Commitment.pdf', size: '4.1 MB', type: 'application/pdf' }
    ],
    status: 'submitted',
    evaluation_score: null,
    submitted_at: subDays(now, 2)
  });

  db.insert('bids', {
    id: 'bid_004',
    tender_id: tender6.id,
    tender_reference_no: tender6.tender_reference_no,
    tender_title: tender6.title,
    department: 'Reserve Bank Information Technology (ReBIT)',
    user_id: userCompany.id,
    bidder_name: userCompany.name,
    bidder_email: userCompany.email,
    company_name: 'TechInfra Smart Systems Pvt Ltd',
    bid_amount: 34000000,
    technical_proposal: '24x7 Security Operations Center with SOAR automation.',
    commercial_terms: 'Quarterly billing against verified threat detection metrics.',
    delivery_timeline_months: 3,
    documents: [
      { name: 'SOC_Capabilities_Deck.pdf', size: '2.9 MB', type: 'application/pdf' }
    ],
    status: 'rejected',
    rejection_reason: 'Mandatory CERT-In Tier-1 empanelment certificate not furnished as required under RFP Section 3.2.',
    evaluated_by: userAdmin.id,
    evaluated_at: subDays(now, 4),
    submitted_at: subDays(now, 8)
  });

  db.insert('bids', {
    id: 'bid_005',
    tender_id: tender7.id,
    tender_reference_no: tender7.tender_reference_no,
    tender_title: tender7.title,
    department: 'Department of Primary Education, Govt of Gujarat',
    user_id: userCompany.id,
    bidder_name: userCompany.name,
    bidder_email: userCompany.email,
    company_name: 'TechInfra Smart Systems Pvt Ltd',
    bid_amount: 4700000,
    technical_proposal: 'Interactive Smart Flat Panels with Gujarati educational curriculum preloaded.',
    commercial_terms: 'Immediate dispatch within 30 days of LOA issuance.',
    delivery_timeline_months: 2,
    documents: [
      { name: 'Hardware_BIS_Certificates.pdf', size: '1.5 MB', type: 'application/pdf' }
    ],
    status: 'awarded',
    evaluation_score: 97,
    evaluated_by: userAuthority.id,
    evaluated_at: subDays(now, 1),
    submitted_at: subDays(now, 12)
  });

  // 9b. Documents (Relational Schema Section 13)
  db.insert('documents', {
    id: 'doc_1',
    user_id: userCompany.user_id,
    tender_id: tender1.id,
    bid_id: 'bid_001',
    document_name: 'Technical_Bid_Solution_v1.2.pdf',
    file_path: '/uploads/documents/Technical_Bid_Solution_v1.2.pdf',
    uploaded_at: subDays(now, 10)
  });
  db.insert('documents', {
    id: 'doc_2',
    user_id: userCompany.user_id,
    tender_id: tender1.id,
    bid_id: 'bid_001',
    document_name: 'EMD_Bank_Guarantee_90Lakhs.pdf',
    file_path: '/uploads/documents/EMD_Bank_Guarantee_90Lakhs.pdf',
    uploaded_at: subDays(now, 10)
  });
  db.insert('documents', {
    id: 'doc_3',
    user_id: userCompany.user_id,
    tender_id: tender1.id,
    bid_id: 'bid_001',
    document_name: 'ISO_27001_Audit_Compliance.pdf',
    file_path: '/uploads/documents/ISO_27001_Compliance.pdf',
    uploaded_at: subDays(now, 10)
  });

  // 9c. Notifications (Relational Schema Section 13)
  db.insert('notifications', {
    id: 'notif_1',
    user_id: userCompany.user_id,
    title: 'Bid Shortlisted',
    message: 'Your bid for Tender GUDM/ITMS/2026/04 has been shortlisted by the Tender Authority.',
    read_status: false,
    created_at: subDays(now, 1)
  });
  db.insert('notifications', {
    id: 'notif_2',
    user_id: userAuthority.user_id,
    title: 'New Bid Received',
    message: 'TechInfra Smart Systems submitted a bid for Tender GUDM/ITMS/2026/04.',
    read_status: true,
    created_at: subDays(now, 10)
  });
  db.insert('notifications', {
    id: 'notif_3',
    user_id: userAdmin.user_id,
    title: 'Security Audit Notice',
    message: 'Scheduled RBAC session & permission audit completed successfully.',
    read_status: true,
    created_at: subDays(now, 2)
  });

  // 10. System Settings
  db.insert('system_settings', {
    id: 'sys_settings_1',
    portal_name: 'TenderHub',
    portal_tagline: 'Secure Tender Management & Bidding Portal',
    maintenance_mode: false,
    allow_public_registration: true,
    min_bid_validity_days: 90,
    max_file_size_mb: 25,
    session_timeout_minutes: 60,
    require_authority_approval: true
  });

  // 11. Categories
  const categories = [
    'Information Technology',
    'Smart Infrastructure',
    'Healthcare & Medical',
    'Civil Works & Highways',
    'Renewable Energy',
    'Cybersecurity & Defence',
    'Education & Training',
    'Facility Management'
  ];
  categories.forEach((cat, idx) => {
    db.insert('categories', {
      id: `cat_${idx + 1}`,
      name: cat,
      description: `Official procurement category for ${cat}`
    });
  });

  // 12. Formatted Audit Logs with User ID Based Identification
  const auditEntries = [
    {
      user_id: 'AUTH001',
      user_name: 'Dr. Rajeshwari Patel',
      user_role: 'Tender Authority',
      action: 'Created Tender',
      entity_type: 'Tender',
      entity_id: 'tnd_itms_001',
      related_tender: 'GUDM/ITMS/2026/04',
      formatted_entry: 'AUTH001 created Tender GUDM/ITMS/2026/04 on 24 September 2026 at 10:30 AM.',
      ip_address: '192.168.1.104',
      device_info: 'Chrome 128 / Windows 11',
      created_at: subDays(now, 14)
    },
    {
      user_id: 'AUTH001',
      user_name: 'Dr. Rajeshwari Patel',
      user_role: 'Tender Authority',
      action: 'Published Tender',
      entity_type: 'Tender',
      entity_id: 'tnd_itms_001',
      related_tender: 'GUDM/ITMS/2026/04',
      formatted_entry: 'AUTH001 published Tender GUDM/ITMS/2026/04 on 24 September 2026 at 11:15 AM.',
      ip_address: '192.168.1.104',
      device_info: 'Chrome 128 / Windows 11',
      created_at: subDays(now, 14)
    },
    {
      user_id: 'BID001',
      user_name: 'Aarav Mehta',
      user_role: 'Company / Bidder',
      action: 'Submitted Bid of ₹43,20,00,000 for Tender',
      entity_type: 'Bid',
      entity_id: 'bid_001',
      related_tender: 'GUDM/ITMS/2026/04',
      formatted_entry: 'BID001 submitted Bid of ₹43,20,00,000 for Tender GUDM/ITMS/2026/04 on 24 September 2026 at 03:45 PM.',
      ip_address: '115.240.12.82',
      device_info: 'Edge 128 / Windows 11',
      created_at: subDays(now, 10)
    },
    {
      user_id: 'ADM001',
      user_name: 'Vikramaditya Sharma',
      user_role: 'Super Admin',
      action: 'Approved Tender Authority Credentials for Dr. Rajeshwari Patel',
      entity_type: 'Authority',
      entity_id: 'auth_gudm_1',
      related_tender: 'GUDM-AUTH-2026',
      formatted_entry: 'ADM001 approved Tender Authority Credentials for AUTH001 on 25 September 2026 at 09:00 AM.',
      ip_address: '10.0.4.15',
      device_info: 'Firefox 130 / macOS Sonoma',
      created_at: subDays(now, 2)
    },
    {
      user_id: 'AUTH001',
      user_name: 'Dr. Rajeshwari Patel',
      user_role: 'Tender Authority',
      action: 'Shortlisted Bid by TechInfra Smart Systems Pvt Ltd for Tender',
      entity_type: 'Bid',
      entity_id: 'bid_001',
      related_tender: 'GUDM/ITMS/2026/04',
      formatted_entry: 'AUTH001 shortlisted Bid by BID001 for Tender GUDM/ITMS/2026/04 on 25 September 2026 at 10:30 AM.',
      ip_address: '192.168.1.104',
      device_info: 'Chrome 128 / Windows 11',
      created_at: subDays(now, 1)
    },
    {
      user_id: 'ADM001',
      user_name: 'Vikramaditya Sharma',
      user_role: 'Super Admin',
      action: 'Verified Company Profile: TechInfra Smart Systems Pvt Ltd',
      entity_type: 'Company',
      entity_id: 'comp_techinfra',
      related_tender: '',
      formatted_entry: 'ADM001 verified Company Profile for BID001 on 25 September 2026 at 11:00 AM.',
      ip_address: '10.0.4.15',
      device_info: 'Firefox 130 / macOS Sonoma',
      created_at: now
    }
  ];

  auditEntries.forEach(entry => db.insert('audit_logs', entry));

  // ============================================================================
  // 13. CLIENT DETAILS & SMART TENDER MATCHING - 10 DEMO CLIENT RECORDS
  // ============================================================================

  // Array of 10 diverse client records from different industries
  const demoClients = [
    {
      userId: 'usr_client_01', userIdFormatted: 'BID003',
      name: 'Priya Sharma', email: 'priya@greeninfra.in', phone: '+91 9812345001',
      company: 'GreenInfra Renewable Solutions Pvt Ltd', designation: 'Managing Director',
      business_type: 'Private Limited', industry: 'Renewable Energy',
      gstin: '07AABCG1234F1Z1', pan: 'AABCG1234F',
      address: '45, Sector 62, Electronic City', city: 'Noida', state: 'Uttar Pradesh', pin: '201309',
      website: 'https://greeninfra.in', description: 'Leading renewable energy company specializing in solar PV, wind energy, and green hydrogen solutions for government and industrial clients.',
      years: 12, turnover: '₹80-100 Cr', employees: '250-500',
      services: ['Solar PV Installation', 'Wind Turbine Engineering', 'Green Hydrogen', 'Energy Auditing', 'EPC Contracting'],
      certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'MNRE Channel Partner', 'ALMM Listed'],
      sectors: ['Renewable Energy', 'Power & Energy', 'Green Infrastructure']
    },
    {
      userId: 'usr_client_02', userIdFormatted: 'BID004',
      name: 'Vikram Patel', email: 'vikram@meditechsys.com', phone: '+91 9812345002',
      company: 'MediTech Healthcare Systems Ltd', designation: 'Chief Executive Officer',
      business_type: 'Public Limited', industry: 'Healthcare & Medical Equipment',
      gstin: '24AABCM5678G1Z5', pan: 'AABCM5678G',
      address: '12, SG Highway, Bodakdev', city: 'Ahmedabad', state: 'Gujarat', pin: '380054',
      website: 'https://meditechsys.com', description: 'Manufacturer and supplier of advanced medical imaging systems, hospital management solutions, and biomedical equipment with nationwide service network.',
      years: 15, turnover: '₹150-200 Cr', employees: '500-1000',
      services: ['MRI Systems', 'CT Scanners', 'Hospital IT Solutions', 'Biomedical Equipment', 'HMIS Implementation'],
      certifications: ['ISO 13485:2016', 'ISO 9001:2015', 'US FDA 510(k)', 'AERB Type Approval', 'BIS Certified'],
      sectors: ['Healthcare & Medical Equipment', 'Biomedical & Healthcare', 'Hospital Infrastructure']
    },
    {
      userId: 'usr_client_03', userIdFormatted: 'BID005',
      name: 'Arjun Reddy', email: 'arjun@skylineconstructions.in', phone: '+91 9812345003',
      company: 'Skyline Constructions & Engineering Pvt Ltd', designation: 'Director - Projects',
      business_type: 'Private Limited', industry: 'Civil Works & Construction',
      gstin: '36AABCS9012H1Z9', pan: 'AABCS9012H',
      address: '78, Jubilee Hills, Road No. 36', city: 'Hyderabad', state: 'Telangana', pin: '500033',
      website: 'https://skylineconstructions.in', description: 'Premier infrastructure development company with expertise in highway construction, bridge engineering, smart city infrastructure, and urban development projects.',
      years: 20, turnover: '₹500-800 Cr', employees: '1000-5000',
      services: ['Highway Construction', 'Bridge Engineering', 'Urban Infrastructure', 'Smart City Projects', 'Metro Rail'],
      certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018', 'Class 1 Civil Contractor'],
      sectors: ['Civil Works & Construction', 'Infrastructure & Highways', 'Urban Development']
    },
    {
      userId: 'usr_client_04', userIdFormatted: 'BID006',
      name: 'Neha Deshmukh', email: 'neha@cybershieldtech.com', phone: '+91 9812345004',
      company: 'CyberShield Technologies Pvt Ltd', designation: 'Founder & CEO',
      business_type: 'Private Limited', industry: 'Cybersecurity & IT Services',
      gstin: '27AABCC3456J1Z3', pan: 'AABCC3456J',
      address: '301, Cyber Tower, Baner', city: 'Pune', state: 'Maharashtra', pin: '411045',
      website: 'https://cybershieldtech.com', description: 'CERT-In empaneled cybersecurity firm offering SOC-as-a-Service, penetration testing, red teaming, cloud security, and compliance consulting for BFSI and government sectors.',
      years: 8, turnover: '₹25-50 Cr', employees: '100-250',
      services: ['SOC Operations', 'VAPT Services', 'Red Teaming', 'Cloud Security', 'Compliance Consulting'],
      certifications: ['CERT-In Empaneled', 'ISO 27001:2022', 'ISO 22301:2019', 'CMMI Level 3'],
      sectors: ['Information Technology', 'Cybersecurity & Financial IT', 'Cloud & Enterprise Software']
    },
    {
      userId: 'usr_client_05', userIdFormatted: 'BID007',
      name: 'Sanjay Gupta', email: 'sanjay@bharatedusmart.com', phone: '+91 9812345005',
      company: 'Bharat EduSmart Solutions Pvt Ltd', designation: 'Managing Partner',
      business_type: 'LLP', industry: 'Education Technology',
      gstin: '09AABCB7890K1Z7', pan: 'AABCB7890K',
      address: '22, Hazratganj', city: 'Lucknow', state: 'Uttar Pradesh', pin: '226001',
      website: 'https://bharatedusmart.com', description: 'End-to-end education technology provider for interactive classrooms, digital content, learning management systems, and skill development training centers for government schools and universities.',
      years: 6, turnover: '₹10-25 Cr', employees: '50-100',
      services: ['Interactive Flat Panels', 'Digital Podiums', 'LMS Development', 'Content Creation', 'Teacher Training'],
      certifications: ['ISO 9001:2015', 'BIS Safety Certification', 'MSME Registered'],
      sectors: ['Electronics & Hardware', 'Education Technology', 'Digital Infrastructure']
    },
    {
      userId: 'usr_client_06', userIdFormatted: 'BID008',
      name: 'Kavitha Nair', email: 'kavitha@aquapuresystems.com', phone: '+91 9812345006',
      company: 'AquaPure Water Treatment Systems Pvt Ltd', designation: 'Technical Director',
      business_type: 'Private Limited', industry: 'Water & Environment',
      gstin: '32AABCA2345L1Z2', pan: 'AABCA2345L',
      address: '56, Technopark Campus', city: 'Thiruvananthapuram', state: 'Kerala', pin: '695581',
      website: 'https://aquapuresystems.com', description: 'Specialized in design, installation, and maintenance of water treatment plants, sewage treatment facilities, and environmental management solutions for municipal corporations and industries.',
      years: 10, turnover: '₹40-60 Cr', employees: '150-250',
      services: ['Water Treatment Plants', 'STP Installation', 'ETP Solutions', 'Desalination', 'Environmental Consulting'],
      certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'CPCB Approved', 'MSME Registered'],
      sectors: ['Water & Environment', 'Municipal Services', 'Environmental Engineering']
    },
    {
      userId: 'usr_client_07', userIdFormatted: 'BID009',
      name: 'Rohit Agarwal', email: 'rohit@defencetechind.com', phone: '+91 9812345007',
      company: 'DefenceTech Industries Ltd', designation: 'Vice President - Business Development',
      business_type: 'Public Limited', industry: 'Defence & Aerospace',
      gstin: '06AABCD6789M1Z6', pan: 'AABCD6789M',
      address: '101, Defence Colony, Phase 1', city: 'Chandigarh', state: 'Punjab', pin: '160001',
      website: 'https://defencetechind.com', description: 'Defence manufacturing company producing radar systems, night vision equipment, communication systems, and UAV components for armed forces and paramilitary organizations.',
      years: 18, turnover: '₹200-500 Cr', employees: '1000-5000',
      services: ['Radar Systems', 'Communication Equipment', 'Night Vision Devices', 'UAV Components', 'EW Systems'],
      certifications: ['ISO 9001:2015', 'AS 9100D', 'DRDO Approved', 'OFB Registered', 'Industrial License'],
      sectors: ['Defence & Aerospace', 'Electronics & Instrumentation', 'Manufacturing']
    },
    {
      userId: 'usr_client_08', userIdFormatted: 'BID010',
      name: 'Meera Krishnamurthy', email: 'meera@logisticspro.in', phone: '+91 9812345008',
      company: 'LogisticsPro Supply Chain Solutions Pvt Ltd', designation: 'Chief Operations Officer',
      business_type: 'Private Limited', industry: 'Logistics & Supply Chain',
      gstin: '29AABCL0123N1Z0', pan: 'AABCL0123N',
      address: '88, Whitefield Tech Park', city: 'Bengaluru', state: 'Karnataka', pin: '560066',
      website: 'https://logisticspro.in', description: 'Technology-driven logistics company providing warehouse management, fleet tracking, cold chain solutions, and last-mile delivery for government and e-commerce sectors.',
      years: 9, turnover: '₹60-80 Cr', employees: '250-500',
      services: ['Warehouse Management', 'Fleet Tracking', 'Cold Chain', 'Last-Mile Delivery', 'Supply Chain Consulting'],
      certifications: ['ISO 9001:2015', 'ISO 22000:2018', 'FSSAI Licensed', 'MSME Registered'],
      sectors: ['Logistics & Supply Chain', 'Transportation', 'Warehousing']
    },
    {
      userId: 'usr_client_09', userIdFormatted: 'BID011',
      name: 'Amit Joshi', email: 'amit@smartagritech.in', phone: '+91 9812345009',
      company: 'SmartAgriTech Solutions Pvt Ltd', designation: 'Founder',
      business_type: 'Startup (DPIIT Recognized)', industry: 'Agriculture Technology',
      gstin: '08AABCS4567P1Z4', pan: 'AABCS4567P',
      address: '14, Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', pin: '302017',
      website: 'https://smartagritech.in', description: 'AgriTech startup developing precision farming platforms, IoT-based soil monitoring systems, drone crop analytics, and digital mandi solutions for state agriculture departments.',
      years: 4, turnover: '₹5-10 Cr', employees: '25-50',
      services: ['Precision Farming', 'IoT Soil Monitoring', 'Drone Analytics', 'Digital Mandi Platform', 'Farmer Training'],
      certifications: ['DPIIT Recognized Startup', 'ISO 9001:2015', 'MSME Registered'],
      sectors: ['Agriculture Technology', 'IoT & Sensors', 'Rural Development']
    },
    {
      userId: 'usr_client_10', userIdFormatted: 'BID012',
      name: 'Fatima Sheikh', email: 'fatima@urbanplanners.co.in', phone: '+91 9812345010',
      company: 'Urban Planners & Architects Pvt Ltd', designation: 'Principal Architect',
      business_type: 'Private Limited', industry: 'Architecture & Urban Planning',
      gstin: '33AABCU8901Q1Z8', pan: 'AABCU8901Q',
      address: '45, Anna Salai, Thousand Lights', city: 'Chennai', state: 'Tamil Nadu', pin: '600006',
      website: 'https://urbanplanners.co.in', description: 'Award-winning architecture and urban planning firm specializing in smart city master planning, green building design, heritage conservation, and municipal infrastructure planning.',
      years: 14, turnover: '₹30-50 Cr', employees: '100-250',
      services: ['Smart City Planning', 'Green Building Design', 'Heritage Conservation', 'Urban Infrastructure', 'GIS Mapping'],
      certifications: ['ISO 9001:2015', 'GRIHA Certified', 'Council of Architecture Registered', 'IGBC Member'],
      sectors: ['Architecture & Urban Planning', 'Smart Infrastructure', 'Environmental Design']
    }
  ];

  // Create client users, profiles, company entries, documents, and activity
  demoClients.forEach((client, idx) => {
    // Create user
    const user = db.insert('users', {
      id: client.userId,
      user_id: client.userIdFormatted,
      name: `${client.name} (${client.company.split(' ').slice(0, 2).join(' ')})`,
      email: client.email,
      password_hash: passwordHash,
      role: 'company_user',
      role_id: roleCompany.id,
      department_id: null,
      phone: client.phone,
      status: idx === 7 ? 'suspended' : 'active', // One suspended for demo
      is_active: idx !== 7,
      organization_id: null,
      last_login: subDays(now, Math.floor(Math.random() * 10))
    });

    // Create client profile
    db.insert('client_profiles', {
      id: `clp_${idx + 1}`,
      user_id: client.userId,
      full_name: client.name,
      designation: client.designation,
      company_name: client.company,
      business_type: client.business_type,
      industry: client.industry,
      gstin: client.gstin,
      pan: client.pan,
      address: client.address,
      city: client.city,
      state: client.state,
      pin_code: client.pin,
      website: client.website,
      description: client.description,
      years_experience: client.years,
      annual_turnover: client.turnover,
      employee_count: client.employees,
      services_products: client.services,
      mobile: client.phone,
      profile_photo: '',
      verification_status: idx < 6 ? 'approved' : (idx === 6 ? 'pending' : (idx === 7 ? 'suspended' : 'pending')),
      account_status: idx === 7 ? 'suspended' : 'active',
      registration_date: subDays(now, 30 + idx * 15)
    });

    // Create company profile for AI matching
    db.insert('company_profiles', {
      id: `cpf_client_${idx + 1}`,
      user_id: client.userId,
      company_name: client.company,
      pan_number: client.pan,
      gst_number: client.gstin,
      annual_turnover: parseInt((client.turnover.match(/\d+/) || ['0'])[0]) * 10000000,
      years_of_experience: client.years,
      certifications: client.certifications,
      state: client.state,
      city: client.city,
      industry_sectors: client.sectors,
      core_capabilities: client.services,
      verified: idx < 6
    });

    // Create company entry
    db.insert('companies', {
      id: `comp_client_${idx + 1}`,
      user_id: client.userIdFormatted,
      company_name: client.company,
      registration_number: `U${Math.floor(10000 + Math.random() * 90000)}${client.state.substring(0, 2).toUpperCase()}20${10 + idx}PTC${Math.floor(100000 + Math.random() * 900000)}`,
      GST_number: client.gstin,
      address: `${client.address}, ${client.city}, ${client.state} - ${client.pin}`,
      experience: `${client.years} Years in ${client.industry}`,
      verification_status: idx < 6 ? 'approved' : 'pending'
    });

    // Create user preferences
    db.insert('user_preferences', {
      id: `pref_client_${idx + 1}`,
      user_id: client.userId,
      categories: client.sectors,
      locations: [client.state, 'Delhi', 'Maharashtra'],
      min_value: 10000000,
      max_value: 1000000000,
      keywords: client.services.slice(0, 4),
      max_deadline_days: 60,
      alert_email_enabled: true,
      alert_in_app_enabled: true
    });

    // Create demo documents for each client
    const docTypes = [
      { type: 'company_registration', name: 'Company Registration Certificate', expiry: null },
      { type: 'gst_certificate', name: 'GST Registration Certificate', expiry: addDays(now, 365) },
      { type: 'pan_document', name: 'PAN Card Copy', expiry: null },
      { type: 'experience_certificate', name: 'Experience Certificate - ' + client.services[0], expiry: null },
      { type: 'financial_statement', name: 'Audited Financial Statements FY 2025-26', expiry: null },
      { type: 'other', name: client.certifications[0] + ' Certificate', expiry: addDays(now, 180) }
    ];

    docTypes.forEach((docType, dIdx) => {
      db.insert('client_documents', {
        id: `cdoc_${idx + 1}_${dIdx + 1}`,
        user_id: client.userId,
        document_type: docType.type,
        document_name: docType.name,
        file_name: `demo_${docType.type}_${idx + 1}.pdf`,
        file_path: `/uploads/demo_${docType.type}_${idx + 1}.pdf`,
        file_size: Math.floor(500000 + Math.random() * 2000000),
        mime_type: 'application/pdf',
        expiry_date: docType.expiry,
        verification_status: dIdx < 3 ? 'verified' : (dIdx === 3 ? 'pending' : 'not_submitted'),
        uploaded_at: subDays(now, 20 + dIdx),
        verified_by: dIdx < 3 ? 'usr_admin' : null,
        verified_at: dIdx < 3 ? subDays(now, 15 + dIdx) : null
      });
    });

    // Create demo activity log entries
    const activities = [
      { type: 'profile_updated', title: 'Profile Updated', desc: 'Client profile details were updated.', daysAgo: 2 },
      { type: 'tender_matched', title: 'New Tender Matched', desc: `AI found ${Math.floor(3 + Math.random() * 8)} matching tenders for your profile.`, daysAgo: 1 },
      { type: 'document_uploaded', title: 'Document Uploaded', desc: `Uploaded ${docTypes[0].name}.`, daysAgo: 5 },
      { type: 'bid_submitted', title: 'Bid Submitted', desc: `Submitted bid for tender in ${client.industry} category.`, daysAgo: 3 },
      { type: 'document_verified', title: 'Document Verified', desc: `${docTypes[0].name} verified by admin.`, daysAgo: 4 }
    ];

    activities.forEach((act, aIdx) => {
      db.insert('client_activity', {
        id: `cact_${idx + 1}_${aIdx + 1}`,
        user_id: client.userId,
        type: act.type,
        title: act.title,
        description: act.desc,
        icon: act.type === 'profile_updated' ? 'user-edit' : act.type === 'tender_matched' ? 'target' : act.type === 'document_uploaded' ? 'file-up' : act.type === 'bid_submitted' ? 'send' : 'shield-check',
        created_at: subDays(now, act.daysAgo)
      });
    });

    // Create notifications for each client
    db.insert('notifications', {
      user_id: client.userIdFormatted,
      title: 'Welcome to TenderHub',
      message: `Welcome ${client.name}! Your ${client.company} profile has been created. Complete your profile to start receiving AI tender matches.`,
      read_status: true,
      created_at: subDays(now, 25)
    });

    db.insert('notifications', {
      user_id: client.userIdFormatted,
      title: idx < 6 ? 'Profile Verified' : 'Profile Verification Pending',
      message: idx < 6
        ? `Your company profile for ${client.company} has been verified by the platform admin.`
        : `Your company profile is pending verification. Please ensure all required documents are uploaded.`,
      read_status: idx < 4,
      created_at: subDays(now, 10)
    });

    if (idx % 2 === 0) {
      db.insert('notifications', {
        user_id: client.userIdFormatted,
        title: 'New Tender Alert',
        message: `${Math.floor(2 + Math.random() * 5)} new tenders matching your ${client.industry} profile have been published.`,
        read_status: false,
        created_at: subDays(now, 1)
      });
    }

    if (idx < 5) {
      db.insert('notifications', {
        user_id: client.userIdFormatted,
        title: 'Tender Deadline Approaching',
        message: `Reminder: A tender deadline in ${client.state} is approaching in the next 7 days.`,
        read_status: false,
        created_at: subDays(now, 2)
      });
    }
  });

  // Also create client profiles for existing demo bidders (BID001 & BID002)
  db.insert('client_profiles', {
    id: 'clp_bid001',
    user_id: 'usr_company',
    full_name: 'Aarav Mehta',
    designation: 'Director',
    company_name: 'TechInfra Smart Systems Pvt Ltd',
    business_type: 'Private Limited',
    industry: 'Information Technology',
    gstin: '24AAACT1234F1Z8',
    pan: 'AAACT1234F',
    address: 'Plot 42, Infocity',
    city: 'Gandhinagar',
    state: 'Gujarat',
    pin_code: '382007',
    website: 'https://techinfra.com',
    description: 'Smart city solutions, IoT surveillance, cloud ERP, and AI-driven traffic management systems.',
    years_experience: 8,
    annual_turnover: '₹50-80 Cr',
    employee_count: '100-250',
    services_products: ['Intelligent Traffic Systems', 'AI Video Analytics', 'Cloud ERP Implementation', 'SCADA & Command Control Centers', 'Cybersecurity Audits'],
    mobile: '+91 9876543212',
    profile_photo: '',
    verification_status: 'approved',
    account_status: 'active',
    registration_date: subDays(now, 90)
  });

  db.insert('client_profiles', {
    id: 'clp_bid002',
    user_id: 'usr_company2',
    full_name: 'Rajesh Singhania',
    designation: 'Managing Director',
    company_name: 'BuildCon Infrastructure Ltd',
    business_type: 'Public Limited',
    industry: 'Civil Works & Construction',
    gstin: '27AABCB9876K1Z2',
    pan: 'AABCB9876K',
    address: 'Nariman Point',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin_code: '400021',
    website: 'https://buildcon.com',
    description: 'Premier construction and infrastructure company specializing in highways, bridges, and heavy civil works.',
    years_experience: 12,
    annual_turnover: '₹100-200 Cr',
    employee_count: '500-1000',
    services_products: ['Highway Construction', 'Bridge Engineering', 'Heavy Civil Works', 'Infrastructure Development'],
    mobile: '+91 9876543216',
    profile_photo: '',
    verification_status: 'approved',
    account_status: 'active',
    registration_date: subDays(now, 120)
  });

  // Add client documents for existing demo bidders
  ['usr_company', 'usr_company2'].forEach((uid, cidx) => {
    ['company_registration', 'gst_certificate', 'pan_document', 'financial_statement'].forEach((dtype, didx) => {
      db.insert('client_documents', {
        user_id: uid,
        document_type: dtype,
        document_name: `${dtype.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} - Demo`,
        file_name: `demo_existing_${cidx}_${didx}.pdf`,
        file_path: `/uploads/demo_existing_${cidx}_${didx}.pdf`,
        file_size: Math.floor(300000 + Math.random() * 1500000),
        mime_type: 'application/pdf',
        expiry_date: null,
        verification_status: 'verified',
        uploaded_at: subDays(now, 30),
        verified_by: 'usr_admin',
        verified_at: subDays(now, 25)
      });
    });

    // Activity for existing bidders
    db.insert('client_activity', {
      user_id: uid,
      type: 'profile_updated',
      title: 'Profile Completed',
      description: 'Full client profile setup completed with all required details.',
      icon: 'user-check',
      created_at: subDays(now, 30)
    });
  });

  console.log('Seeding completed successfully!');
  console.log(`- Users: ${db.count('users')}`);
  console.log(`- Roles: ${db.count('roles')}`);
  console.log(`- Permissions: ${db.count('permissions')}`);
  console.log(`- Departments: ${db.count('departments')}`);
  console.log(`- Companies: ${db.count('companies')}`);
  console.log(`- Documents: ${db.count('documents')}`);
  console.log(`- Notifications: ${db.count('notifications')}`);
  console.log(`- Tenders: ${db.count('tenders')}`);
  console.log(`- Bids: ${db.count('bids')}`);
  console.log(`- Audit Logs: ${db.count('audit_logs')}`);
  console.log(`- Client Profiles: ${db.count('client_profiles')}`);
  console.log(`- Client Documents: ${db.count('client_documents')}`);
  console.log(`- Client Activity: ${db.count('client_activity')}`);
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

