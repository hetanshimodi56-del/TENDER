const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function parseUrl(urlStr) {
  const parsed = new URL(urlStr);
  return {
    hostname: parsed.hostname,
    port: parsed.port || 80,
    path: parsed.pathname + parsed.search,
  };
}

async function runTests() {
  console.log('====================================================');
  console.log('  AI E-TENDER PLATFORM: AUTOMATED API TEST SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extraInfo = '') {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} - ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Demo Login - Bidder (company_user)
    console.log('\n--- 1. AUTHENTICATION & PERSONAS ---');
    const bidderLogin = await request({
      ...parseUrl(`${BASE_URL}/auth/demo-login`),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'company_user' });
    assert('Bidder demo login returns HTTP 200', bidderLogin.status === 200);
    assert('Bidder token received', !!bidderLogin.data?.token);
    const bidderToken = bidderLogin.data?.token;

    // Demo Login - Super Admin
    const adminLogin = await request({
      ...parseUrl(`${BASE_URL}/auth/demo-login`),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'super_admin' });
    assert('Super Admin demo login returns HTTP 200', adminLogin.status === 200);
    assert('Super Admin token received', !!adminLogin.data?.token);
    const adminToken = adminLogin.data?.token;

    // Demo Login - Authority
    const authorityLogin = await request({
      ...parseUrl(`${BASE_URL}/auth/demo-login`),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'tender_authority' });
    assert('Tender Authority demo login returns HTTP 200', authorityLogin.status === 200);
    assert('Authority token received', !!authorityLogin.data?.token);
    const authorityToken = authorityLogin.data?.token;

    // Demo Login - Evaluator
    const evaluatorLogin = await request({
      ...parseUrl(`${BASE_URL}/auth/demo-login`),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'evaluator' });
    assert('Evaluator demo login returns HTTP 200', evaluatorLogin.status === 200);
    assert('Evaluator token received', !!evaluatorLogin.data?.token);
    const evaluatorToken = evaluatorLogin.data?.token;

    // 2. Tenders Discovery
    console.log('\n--- 2. TENDERS DISCOVERY & FILTERING ---');
    const tendersList = await request({
      ...parseUrl(`${BASE_URL}/tenders`),
      method: 'GET',
    });
    assert('GET /api/tenders returns HTTP 200', tendersList.status === 200);
    assert('Tenders list has items', tendersList.data?.data?.length > 0);
    const testTender = tendersList.data?.data?.[0];
    const testTenderId = testTender?.id;
    console.log(`  > Found ${tendersList.data?.data?.length} tenders. Using sample tender: ${testTenderId} ("${testTender?.title?.substring(0, 40)}...")`);

    // Filter tenders by Category
    const filteredByCategory = await request({
      ...parseUrl(`${BASE_URL}/tenders?category=Information+Technology`),
      method: 'GET',
    });
    assert('Filter tenders by Category returns HTTP 200', filteredByCategory.status === 200);

    // Single Tender Detail
    const singleTender = await request({
      ...parseUrl(`${BASE_URL}/tenders/${testTenderId}`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    assert(`GET /api/tenders/${testTenderId} returns HTTP 200`, singleTender.status === 200);
    assert('Tender details contains reference no', !!singleTender.data?.tender?.tender_reference_no);
    assert('Single tender attached aiEvaluation', !!singleTender.data?.aiEvaluation);

    // 3. AI Recommendation Engine
    console.log('\n--- 3. AI RECOMMENDATION & MATCHING ENGINE ---');
    const aiRec = await request({
      ...parseUrl(`${BASE_URL}/recommendations/${testTenderId}`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    assert('GET /api/recommendations/:id returns HTTP 200', aiRec.status === 200);
    assert('AI match score returned', typeof aiRec.data?.data?.score === 'number');
    assert('AI scoring breakdown returned', !!aiRec.data?.data?.breakdown);
    assert('AI match reasons returned', Array.isArray(aiRec.data?.data?.reasons));
    console.log(`  > Match Score: ${aiRec.data?.data?.score}% | Confidence: ${aiRec.data?.data?.confidence}`);

    // AI Document Summary
    const docSummary = await request({
      ...parseUrl(`${BASE_URL}/ai/document-summary/${testTenderId}`),
      method: 'GET',
    });
    assert('GET /api/ai/document-summary returns HTTP 200', docSummary.status === 200);
    assert('Document summary has key clauses and criteria', !!docSummary.data?.data?.clauses_summary);

    // Grounded Ask Tender AI Chat
    const askAI = await request({
      ...parseUrl(`${BASE_URL}/ai/ask`),
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bidderToken}`
      }
    }, {
      tender_id: testTenderId,
      query: 'What is the required turnover and experience for this tender?'
    });
    assert('POST /api/ai/ask returns HTTP 200', askAI.status === 200);
    assert('AI answer returned with grounded response', !!askAI.data?.data?.answer);
    console.log(`  > AI Query Response snippet: "${askAI.data?.data?.answer?.substring(0, 90)}..."`);

    // 4. One-Click Eligibility Checker
    console.log('\n--- 4. ONE-CLICK ELIGIBILITY ENGINE ---');
    const eligCheck = await request({
      ...parseUrl(`${BASE_URL}/eligibility/check`),
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bidderToken}`
      }
    }, { tender_id: testTenderId });
    assert('POST /api/eligibility/check returns HTTP 200', eligCheck.status === 200);
    assert('Eligibility result has status', !!eligCheck.data?.data?.status);
    assert('Eligibility matchedCriteria array returned', Array.isArray(eligCheck.data?.data?.matchedCriteria));
    assert('Eligibility percentage returned', typeof eligCheck.data?.data?.percentage === 'number');
    console.log(`  > Eligibility Status: ${eligCheck.data?.data?.status} | Percentage: ${eligCheck.data?.data?.percentage}%`);

    // Eligibility History
    const eligHistory = await request({
      ...parseUrl(`${BASE_URL}/eligibility/history`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    assert('GET /api/eligibility/history returns HTTP 200', eligHistory.status === 200);

    // 5. Personalization: Saved, Alerts, Calendar, Compare
    console.log('\n--- 5. PERSONALIZATION FEATURES ---');
    const saveToggle = await request({
      ...parseUrl(`${BASE_URL}/saved`),
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bidderToken}`
      }
    }, { tender_id: testTenderId, notes: 'Automated test note' });
    assert('POST /api/saved (Toggle bookmark) returns HTTP 200/201', saveToggle.status === 200 || saveToggle.status === 201);

    const savedList = await request({
      ...parseUrl(`${BASE_URL}/saved`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    assert('GET /api/saved returns HTTP 200', savedList.status === 200);

    const alertsList = await request({
      ...parseUrl(`${BASE_URL}/alerts`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    assert('GET /api/alerts returns HTTP 200', alertsList.status === 200);

    const calendarEvents = await request({
      ...parseUrl(`${BASE_URL}/calendar`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    assert('GET /api/calendar returns HTTP 200', calendarEvents.status === 200);

    // Comparison Matrix
    const compareTenders = await request({
      ...parseUrl(`${BASE_URL}/compare`),
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bidderToken}`
      }
    }, { tender_ids: [tendersList.data.data[0].id, tendersList.data.data[1].id] });
    assert('POST /api/compare returns HTTP 200', compareTenders.status === 200);
    assert('Comparison matrix returns comparison list', !!compareTenders.data?.data);

    // 6. Super Admin & Governance
    console.log('\n--- 6. SUPER ADMIN & GOVERNANCE ---');
    const adminKPIs = await request({
      ...parseUrl(`${BASE_URL}/admin/kpis`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert('GET /api/admin/kpis returns HTTP 200', adminKPIs.status === 200);
    assert('Admin KPIs contain metrics', typeof adminKPIs.data?.kpis?.totalTenders === 'number');

    const adminUsers = await request({
      ...parseUrl(`${BASE_URL}/admin/users`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert('GET /api/admin/users returns HTTP 200', adminUsers.status === 200);

    const adminAuthorities = await request({
      ...parseUrl(`${BASE_URL}/admin/authorities`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert('GET /api/admin/authorities returns HTTP 200', adminAuthorities.status === 200);

    const auditLogs = await request({
      ...parseUrl(`${BASE_URL}/admin/audit-logs`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert('GET /api/admin/audit-logs returns HTTP 200', auditLogs.status === 200);

    // 7. Tender Authority & Publishing
    console.log('\n--- 7. TENDER AUTHORITY & PUBLISHING ---');
    const authorityTenders = await request({
      ...parseUrl(`${BASE_URL}/authority/tenders`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authorityToken}` }
    });
    assert('GET /api/authority/tenders returns HTTP 200', authorityTenders.status === 200);

    // Create a new tender as authority
    const newTenderRes = await request({
      ...parseUrl(`${BASE_URL}/tenders`),
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authorityToken}`
      }
    }, {
      tender_reference_no: `TEST/GOV/${Date.now().toString().slice(-4)}`,
      title: 'Automated Test High-Speed Fiber Optical Backbone Network',
      description: 'Design, supply, installation and maintenance of 500km optical fiber network across state highways.',
      organization_name: 'Gujarat Informatics Limited (GIL)',
      category: 'Information Technology',
      industry: 'Telecommunications',
      location_state: 'Gujarat',
      location_city: 'Gandhinagar',
      estimated_value: 45000000,
      emd_amount: 900000,
      tender_fee: 5000,
      closing_date: new Date(Date.now() + 15 * 86400000).toISOString(),
      opening_date: new Date(Date.now() + 16 * 86400000).toISOString(),
      min_turnover_required: 30000000,
      min_experience_years: 3,
      required_certifications: ['ISO 9001', 'ISO 27001'],
      required_documents: ['Company Registration', 'Audited Balance Sheets (3 Yrs)', 'GSTIN Certificate']
    });
    assert('POST /api/tenders creates tender successfully', newTenderRes.status === 201 || newTenderRes.status === 200);
    const createdTenderId = newTenderRes.data?.data?.id;

    if (createdTenderId) {
      // Update status
      const statusUpdate = await request({
        ...parseUrl(`${BASE_URL}/tenders/${createdTenderId}/status`),
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authorityToken}`
        }
      }, { status: 'published' });
      assert('PATCH /api/tenders/:id/status updates status to published', statusUpdate.status === 200);
    }

    // 8. Evaluator Portal
    console.log('\n--- 8. EVALUATOR PORTAL ---');
    const evaluationsList = await request({
      ...parseUrl(`${BASE_URL}/evaluations`),
      method: 'GET',
      headers: { 'Authorization': `Bearer ${evaluatorToken}` }
    });
    assert('GET /api/evaluations returns HTTP 200', evaluationsList.status === 200);

    console.log('\n====================================================');
    console.log(`  FINAL VERIFICATION: ${passed} PASSED, ${failed} FAILED `);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Test Runner Exception:', err);
    process.exit(1);
  }
}

runTests();
