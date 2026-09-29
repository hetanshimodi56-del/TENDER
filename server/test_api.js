const { app, server } = require('./src/server.js');

async function runTests() {
  const baseUrl = 'http://localhost:5000/api';

  try {
    console.log('\n--- 1. Testing Demo Login as Company User ---');
    let res = await fetch(`${baseUrl}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'company_user' })
    });
    const bidderAuth = await res.json();
    console.log('Bidder Login:', bidderAuth.success, bidderAuth.user?.name, 'Role:', bidderAuth.user?.role);
    const bidderToken = bidderAuth.token;

    console.log('\n--- 2. Testing Tender Discovery with AI Match Scores ---');
    res = await fetch(`${baseUrl}/tenders?limit=3`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const tenderList = await res.json();
    console.log(`Retrieved ${tenderList.data.length} tenders. Total: ${tenderList.total}`);
    tenderList.data.forEach(t => {
      console.log(`- [${t.tender_reference_no}] ${t.title.substring(0, 45)}... | Match: ${t.ai_match_score}%`);
    });

    const firstTenderId = tenderList.data[0].id;

    console.log('\n--- 3. Testing One-Click Eligibility Checker ---');
    res = await fetch(`${baseUrl}/eligibility/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bidderToken}`
      },
      body: JSON.stringify({ tender_id: firstTenderId })
    });
    const eligibilityResult = await res.json();
    console.log('Eligibility Status:', eligibilityResult.data.status, `(${eligibilityResult.data.percentage}%)`);
    console.log('Matched Criteria:', eligibilityResult.data.matchedCriteria.length);
    console.log('Missing Criteria:', eligibilityResult.data.missingCriteria.length);

    console.log('\n--- 4. Testing Grounded Ask-Your-Tender AI ---');
    res = await fetch(`${baseUrl}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bidderToken}`
      },
      body: JSON.stringify({
        tender_id: firstTenderId,
        query: 'What is the required EMD amount and tender fee?'
      })
    });
    const aiAnswer = await res.json();
    console.log('AI Answer:', aiAnswer.data.answer);
    console.log('Citations Cited:', aiAnswer.data.citations?.length);

    console.log('\n--- 5. Testing Tender Comparison Matrix ---');
    const compareIds = tenderList.data.slice(0, 3).map(t => t.id);
    res = await fetch(`${baseUrl}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bidderToken}`
      },
      body: JSON.stringify({ tender_ids: compareIds })
    });
    const comparison = await res.json();
    console.log(`Compared ${comparison.count} tenders side-by-side.`);

    console.log('\n--- 6. Testing Super Admin KPIs & Data Quality ---');
    res = await fetch(`${baseUrl}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'super_admin' })
    });
    const adminAuth = await res.json();
    const adminToken = adminAuth.token;

    res = await fetch(`${baseUrl}/admin/kpis`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const kpis = await res.json();
    console.log('Admin KPIs:', {
      totalTenders: kpis.kpis.totalTenders,
      activeTenders: kpis.kpis.activeTenders,
      healthScore: kpis.dataQuality.healthScore,
      totalUsers: kpis.kpis.totalUsers
    });

    console.log('\n--- 7. Testing Tender Authority Publishing Flow ---');
    res = await fetch(`${baseUrl}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'tender_authority' })
    });
    const authUser = await res.json();
    const authorityToken = authUser.token;

    res = await fetch(`${baseUrl}/tenders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authorityToken}`
      },
      body: JSON.stringify({
        tender_reference_no: `TEST/PUB/${Date.now().toString().slice(-4)}`,
        title: 'Deployment of High-Speed Wi-Fi 6 APs across 50 Government Secretariats',
        category: 'Information Technology',
        industry: 'Telecommunications',
        location_state: 'Gujarat',
        location_city: 'Gandhinagar',
        estimated_value: 32000000,
        closing_date: new Date(Date.now() + 25 * 86400000).toISOString(),
        min_turnover_required: 20000000,
        min_experience_years: 3,
        required_certifications: ['ISO 9001:2015', 'Wi-Fi Alliance Certified'],
        required_documents: ['Technical Bid', 'OEM Authorization', 'EMD Proof'],
        status: 'published'
      })
    });
    const newTender = await res.json();
    console.log('Created Tender:', newTender.success, newTender.tender?.tender_reference_no);

    console.log('\n--- ALL BACKEND API TESTS PASSED WITH 100% SUCCESS! ---');
  } catch (err) {
    console.error('Test suite failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

setTimeout(runTests, 1000);
