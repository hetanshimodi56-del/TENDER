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
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
