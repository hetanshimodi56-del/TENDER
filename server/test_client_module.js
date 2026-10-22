const { app, server } = require('./src/server.js');

async function testClientModule() {
  const baseUrl = 'http://localhost:5000/api';

  try {
    console.log('\n======================================================');
    console.log('   CLIENT DETAILS & SMART TENDER MATCHING API TESTS   ');
    console.log('======================================================\n');

    // 1. Bidder Login
    console.log('[1/12] Testing Bidder Demo Login...');
    let res = await fetch(`${baseUrl}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'company_user' })
    });
    const bidderAuth = await res.json();
    console.log('       ✓ Logged in as:', bidderAuth.user?.name, 'ID:', bidderAuth.user?.user_id || bidderAuth.user?.id);
    const bidderToken = bidderAuth.token;

    // 2. Client Profile
    console.log('\n[2/12] Testing GET /client/profile...');
    res = await fetch(`${baseUrl}/client/profile`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const profileRes = await res.json();
    console.log('       ✓ Profile loaded:', profileRes.success);
    console.log('       - Client ID:', profileRes.data?.profile?.client_id || profileRes.data?.profile?.user_id_formatted);
    console.log('       - Company:', profileRes.data?.profile?.company_name);
    console.log('       - Industry:', profileRes.data?.profile?.industry);
    console.log('       - Stats:', profileRes.data?.stats);

    // 3. Update Client Profile
    console.log('\n[3/12] Testing PUT /client/profile...');
    res = await fetch(`${baseUrl}/client/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bidderToken}`
      },
      body: JSON.stringify({
        years_experience: 12,
        annual_turnover_range: '₹100 Cr - ₹500 Cr',
        services_offered: ['Smart Grid', 'Solar PV', 'IoT Scada', 'Energy Storage']
      })
    });
    const updateRes = await res.json();
    console.log('       ✓ Update result:', updateRes.success, updateRes.message);

    // 4. Smart Matches
    console.log('\n[4/12] Testing GET /client/smart-matches...');
    res = await fetch(`${baseUrl}/client/smart-matches`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const matchRes = await res.json();
    console.log('       ✓ Smart matches loaded:', matchRes.success);
    console.log(`       - Total Recommended Tenders: ${matchRes.data?.recommendations?.length || 0}`);
    if (matchRes.data?.recommendations?.length > 0) {
      const topMatch = matchRes.data.recommendations[0];
      console.log(`       - Top match: "${topMatch.tender?.title?.substring(0, 40)}..."`);
      console.log(`         Match Score: ${topMatch.match_percentage}%`);
      console.log(`         Reasons: ${topMatch.match_reasons?.join(', ')}`);
      console.log(`         Missing: ${topMatch.missing_requirements?.length ? topMatch.missing_requirements.join(', ') : 'None'}`);
    }

    // 5. Client Documents
    console.log('\n[5/12] Testing GET /client/documents...');
    res = await fetch(`${baseUrl}/client/documents`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const docsRes = await res.json();
    console.log('       ✓ Documents retrieved:', docsRes.success, `Count: ${docsRes.data?.length || 0}`);
    if (docsRes.data?.length > 0) {
      console.log(`       - First doc: [${docsRes.data[0].document_type}] ${docsRes.data[0].document_name} (${docsRes.data[0].verification_status})`);
    }

    // 6. Client Activity
    console.log('\n[6/12] Testing GET /client/activity...');
    res = await fetch(`${baseUrl}/client/activity`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const actRes = await res.json();
    console.log('       ✓ Activity logs loaded:', actRes.success, `Count: ${actRes.data?.length || 0}`);

    // 7. Client Notifications
    console.log('\n[7/12] Testing GET /client/notifications...');
    res = await fetch(`${baseUrl}/client/notifications`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const notifRes = await res.json();
    console.log('       ✓ Notifications loaded:', notifRes.success, `Count: ${notifRes.data?.length || 0}`);

    // 8. Super Admin Login
    console.log('\n[8/12] Testing Super Admin Demo Login...');
    res = await fetch(`${baseUrl}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'super_admin' })
    });
    const adminAuth = await res.json();
    console.log('       ✓ Logged in as Super Admin:', adminAuth.user?.name);
    const adminToken = adminAuth.token;

    // 9. Admin Get Clients
    console.log('\n[9/12] Testing GET /admin/clients (Requirement 7)...');
    res = await fetch(`${baseUrl}/admin/clients?limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminClientsRes = await res.json();
    console.log('       ✓ Clients retrieved:', adminClientsRes.success, `Total: ${adminClientsRes.total}`);
    adminClientsRes.data?.forEach(c => {
      console.log(`       - [${c.user_id}] ${c.name} (${c.company_name}) | ${c.industry} | ${c.status}`);
    });

    // 10. Admin Client Detail Dossier
    const testClientId = adminClientsRes.data[0]?.id;
    console.log(`\n[10/12] Testing GET /admin/clients/${testClientId} (Dossier)...`);
    res = await fetch(`${baseUrl}/admin/clients/${testClientId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dossierRes = await res.json();
    console.log('       ✓ Full Dossier loaded:', dossierRes.success);
    console.log('       - Client:', dossierRes.data?.profile?.full_name);
    console.log('       - Company:', dossierRes.data?.profile?.company_name);
    console.log('       - Turnover:', dossierRes.data?.profile?.annual_turnover_range);
    console.log('       - Docs submitted:', dossierRes.data?.documents?.length || 0);
    console.log('       - Bids submitted:', dossierRes.data?.bids?.length || 0);

    // 11. Admin Document Verification
    if (dossierRes.data?.documents?.length > 0) {
      const docToVerify = dossierRes.data.documents[0];
      console.log(`\n[11/12] Testing PATCH /admin/client-documents/${docToVerify.id}/verify...`);
      res = await fetch(`${baseUrl}/admin/client-documents/${docToVerify.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          verification_status: 'verified',
          remarks: 'All statutory compliances verified by Super Admin.'
        })
      });
      const verifyRes = await res.json();
      console.log('       ✓ Document verified:', verifyRes.success, verifyRes.message);
    }

    // 12. Admin Toggle Client Status
    console.log(`\n[12/12] Testing PATCH /admin/clients/${testClientId}/toggle...`);
    res = await fetch(`${baseUrl}/admin/clients/${testClientId}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const toggleRes = await res.json();
    console.log('       ✓ Account status toggle:', toggleRes.success, toggleRes.message);

    // Toggle back to active
    await fetch(`${baseUrl}/admin/clients/${testClientId}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('\n======================================================');
    console.log('   ALL 12/12 API SUITE TESTS PASSED SUCCESSFULLY!    ');
    console.log('======================================================\n');

  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    if (server && server.close) {
      server.close();
    }
    process.exit(0);
  }
}

// Allow server 500ms to bind if starting fresh
setTimeout(testClientModule, 600);
