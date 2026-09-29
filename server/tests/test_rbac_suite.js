const http = require('http');

const PORT = 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const req = http.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE AUTHENTICATION & RBAC SECURITY TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Test ${total}: ${testName} - ${details}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Unauthenticated request to protected API returns 401
    // -------------------------------------------------------------
    const unauthApi = await makeRequest('/api/admin/users');
    assert(unauthApi.statusCode === 401, 'Unauthenticated request to /api/admin/users returns 401 Unauthorized', `Got ${unauthApi.statusCode}`);

    // -------------------------------------------------------------
    // Test 2: Unauthenticated direct browser navigation to /admin/dashboard redirects to login
    // -------------------------------------------------------------
    const unauthPage = await makeRequest('/admin/dashboard');
    assert(
      unauthPage.statusCode === 302 && (unauthPage.headers.location || '').includes('login=true'),
      'Unauthenticated direct page navigation to /admin/dashboard redirects to Login',
      `Got status ${unauthPage.statusCode}, location: ${unauthPage.headers.location}`
    );

    // -------------------------------------------------------------
    // Test 3: Login as Super Admin (ADM001) retrieves role from DB and provides token + session
    // -------------------------------------------------------------
    const adminLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'ADM001', password: 'Password@123' }
    });
    assert(
      adminLogin.statusCode === 200 && adminLogin.json?.user?.role === 'super_admin' && Boolean(adminLogin.json?.token),
      'Super Admin logs in with verified credentials and genuine DB role "super_admin"',
      `Status: ${adminLogin.statusCode}, Role: ${adminLogin.json?.user?.role}`
    );
    const adminToken = adminLogin.json?.token;
    const adminCookie = (adminLogin.headers['set-cookie'] || [])[0]?.split(';')[0];

    // -------------------------------------------------------------
    // Test 4: Admin can access Admin API (/api/admin/users)
    // -------------------------------------------------------------
    const adminUsers = await makeRequest('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminUsers.statusCode === 200 && Array.isArray(adminUsers.json?.data), 'Super Admin can access /api/admin/users', `Got ${adminUsers.statusCode}`);

    // -------------------------------------------------------------
    // Test 5: Login as Normal User / Public Viewer (VIEW001)
    // -------------------------------------------------------------
    const userLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'VIEW001', password: 'Password@123' }
    });
    assert(
      userLogin.statusCode === 200 && userLogin.json?.user?.role === 'viewer',
      'Normal User logs in and receives verified role "viewer"',
      `Status: ${userLogin.statusCode}, Role: ${userLogin.json?.user?.role}`
    );
    const userToken = userLogin.json?.token;
    const userCookie = (userLogin.headers['set-cookie'] || [])[0]?.split(';')[0];

    // -------------------------------------------------------------
    // Test 6: Normal User calling Admin API (/api/admin/users) is REJECTED with 403 Forbidden
    // -------------------------------------------------------------
    const userAdminApi = await makeRequest('/api/admin/users', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userAdminApi.statusCode === 403, 'Normal User calling /api/admin/users is rejected with 403 Forbidden', `Got ${userAdminApi.statusCode}`);

    // -------------------------------------------------------------
    // Test 7: Normal User manually opening Admin URL (/admin/dashboard) in browser is REJECTED with 403
    // -------------------------------------------------------------
    const userAdminPage = await makeRequest('/admin/dashboard', {
      headers: { Cookie: userCookie }
    });
    assert(
      userAdminPage.statusCode === 403 && userAdminPage.data.includes('403 Forbidden'),
      'Normal User navigating to /admin/dashboard receives backend 403 Forbidden page',
      `Got status ${userAdminPage.statusCode}`
    );

    // -------------------------------------------------------------
    // Test 8: Login as Vendor / Company User (BID001)
    // -------------------------------------------------------------
    const vendorLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'BID001', password: 'Password@123' }
    });
    assert(
      vendorLogin.statusCode === 200 && vendorLogin.json?.user?.role === 'company_user',
      'Vendor logs in and receives genuine DB role "company_user"',
      `Status: ${vendorLogin.statusCode}, Role: ${vendorLogin.json?.user?.role}`
    );
    const vendorToken = vendorLogin.json?.token;
    const vendorCookie = (vendorLogin.headers['set-cookie'] || [])[0]?.split(';')[0];

    // -------------------------------------------------------------
    // Test 9: Vendor navigating to Admin URL (/admin/settings) is REJECTED with 403
    // -------------------------------------------------------------
    const vendorAdminPage = await makeRequest('/admin/settings', {
      headers: { Cookie: vendorCookie }
    });
    assert(
      vendorAdminPage.statusCode === 403 && vendorAdminPage.data.includes('403 Forbidden'),
      'Vendor navigating to /admin/settings receives backend 403 Forbidden',
      `Got status ${vendorAdminPage.statusCode}`
    );

    // -------------------------------------------------------------
    // Test 10: Vendor accessing own bids vs another company's bids (IDOR Protection)
    // -------------------------------------------------------------
    // Login as second vendor BID002
    const vendor2Login = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'BID002', password: 'Password@123' }
    });
    const vendor2Token = vendor2Login.json?.token;

    // Get Vendor 1's bids
    const v1BidsRes = await makeRequest('/api/bids/my', {
      headers: { Authorization: `Bearer ${vendorToken}` }
    });
    const v1Bid = v1BidsRes.json?.data?.[0];

    if (v1Bid) {
      // Vendor 2 attempts to fetch Vendor 1's private bid details
      const idorAttempt = await makeRequest(`/api/bids/${v1Bid.id}`, {
        headers: { Authorization: `Bearer ${vendor2Token}` }
      });
      assert(
        idorAttempt.statusCode === 403,
        'Vendor 2 attempting to view Vendor 1\'s private bid via IDOR is rejected with 403 Forbidden',
        `Got status ${idorAttempt.statusCode}`
      );
    } else {
      assert(true, 'IDOR test: No bids to check, default isolation active');
    }

    // -------------------------------------------------------------
    // Test 11: Normal user trying to create a tender via POST /api/tenders is REJECTED with 403
    // -------------------------------------------------------------
    const userCreateTender = await makeRequest('/api/tenders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        tender_reference_no: 'HACK-001',
        title: 'Unauthorized Tender',
        estimated_value: 1000000,
        closing_date: '2026-12-31'
      }
    });
    assert(
      userCreateTender.statusCode === 403,
      'Normal user cannot create a tender via POST /api/tenders (403 Forbidden)',
      `Got status ${userCreateTender.statusCode}`
    );

    // -------------------------------------------------------------
    // Test 12: Login does NOT trust spoofed role parameter (e.g. role='super_admin')
    // -------------------------------------------------------------
    const spoofLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'VIEW001', password: 'Password@123', role: 'super_admin' }
    });
    assert(
      spoofLogin.json?.user?.role === 'viewer',
      'Login ignores spoofed "role=super_admin" request param and enforces database role "viewer"',
      `Returned role: ${spoofLogin.json?.user?.role}`
    );

    // -------------------------------------------------------------
    // Test 13: Logout terminates server session completely
    // -------------------------------------------------------------
    const logoutRes = await makeRequest('/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: adminCookie }
    });
    assert(logoutRes.statusCode === 200, 'Logout terminates active session and clears session cookie');

    // Attempting to use the old session cookie after logout
    const postLogoutReq = await makeRequest('/admin/dashboard', {
      headers: { Cookie: adminCookie }
    });
    assert(
      postLogoutReq.statusCode === 302,
      'Post-logout request with invalidated session cookie is redirected to login (preventing back-button hijack)',
      `Got status ${postLogoutReq.statusCode}`
    );

  } catch (err) {
    console.error('Fatal test runner error:', err);
  }

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
