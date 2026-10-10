const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: options.method || 'GET',
        headers: defaultHeaders,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(body);
          } catch {
            data = body;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- EXECUTING MODULE 1 ACCEPTANCE TESTS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Home Page HTTP 200
  try {
    const homeRes = await request('/');
    assert(homeRes.status === 200, 'Home page returns HTTP 200');
  } catch (err) {
    assert(false, `Home page request failed: ${err.message}`);
  }

  // 2. Intro Page HTTP 200
  try {
    const introRes = await request('/intro');
    assert(introRes.status === 200, 'Intro page returns HTTP 200');
  } catch (err) {
    assert(false, `Intro page request failed: ${err.message}`);
  }

  // 3. Unauthenticated session check
  try {
    const meRes = await request('/api/auth/me');
    assert(meRes.status === 200 && meRes.data.authenticated === false, 'Unauthenticated /api/auth/me returns authenticated: false');
  } catch (err) {
    assert(false, `Unauthenticated session check failed: ${err.message}`);
  }

  // 4. Registration validation: password too weak
  try {
    const weakPassRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Test User',
        email: 'weakpass@test.com',
        password: 'weak',
        confirmPassword: 'weak'
      }
    });
    assert(weakPassRes.status === 400, 'Registration rejects weak passwords with 400 Bad Request');
  } catch (err) {
    assert(false, `Weak password test failed: ${err.message}`);
  }

  // 5. Successful customer registration
  const uniqueEmail = `qa_customer_${Date.now()}@heaven.com`;
  let customerCookie = '';
  try {
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'QA Luxury Client',
        email: uniqueEmail,
        password: 'LuxuryPassword123!',
        confirmPassword: 'LuxuryPassword123!'
      }
    });
    assert(regRes.status === 200 && regRes.data.success === true, 'Customer registration succeeds with 200 OK');
    assert(regRes.data.user.role === 'CUSTOMER', 'New user role is strictly locked to CUSTOMER');
    
    // Extract set-cookie
    const setCookie = regRes.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      customerCookie = setCookie[0].split(';')[0];
      assert(customerCookie.includes('heaven_auth_token='), 'Registration sets httpOnly heaven_auth_token cookie');
    } else {
      assert(false, 'Registration did not set cookie');
    }
  } catch (err) {
    assert(false, `Registration failed: ${err.message}`);
  }

  // 6. Duplicate email prevention
  try {
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Duplicate QA Client',
        email: uniqueEmail,
        password: 'LuxuryPassword123!',
        confirmPassword: 'LuxuryPassword123!'
      }
    });
    assert(dupRes.status === 409, 'Duplicate registration rejected with 409 Conflict');
  } catch (err) {
    assert(false, `Duplicate email check failed: ${err.message}`);
  }

  // 7. Session check with customer cookie
  try {
    const authMeRes = await request('/api/auth/me', {
      headers: { Cookie: customerCookie }
    });
    assert(
      authMeRes.status === 200 && authMeRes.data.authenticated === true && authMeRes.data.user.email === uniqueEmail,
      'Authenticated /api/auth/me returns valid user profile'
    );
  } catch (err) {
    assert(false, `Authenticated session check failed: ${err.message}`);
  }

  // 8. Admin login validation with seeded admin account
  let adminCookie = '';
  try {
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: '24eg105t14@anurag.edu.in',
        password: 'chandu@8688673019',
        expectedRole: 'ADMIN'
      }
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.user.role === 'ADMIN', 'Seeded Admin login succeeds on admin portal');
    const setCookie = adminLoginRes.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      adminCookie = setCookie[0].split(';')[0];
    }
  } catch (err) {
    assert(false, `Admin login failed: ${err.message}`);
  }

  // 9. Privilege Escalation Prevention: Customer attempting to log in as ADMIN
  try {
    const fraudAdminRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: uniqueEmail,
        password: 'LuxuryPassword123!',
        expectedRole: 'ADMIN'
      }
    });
    assert(fraudAdminRes.status === 403, 'Customer denied access to ADMIN portal with 403 Forbidden');
  } catch (err) {
    assert(false, `Privilege escalation prevention failed: ${err.message}`);
  }

  // 10. Delivery partner login validation with seeded courier account
  try {
    const deliveryLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'delivery@heaven.com',
        password: 'DeliveryPassword123!',
        expectedRole: 'DELIVERY_PARTNER'
      }
    });
    assert(
      deliveryLoginRes.status === 200 && deliveryLoginRes.data.user.role === 'DELIVERY_PARTNER',
      'Seeded Delivery Partner login succeeds on courier portal'
    );
  } catch (err) {
    assert(false, `Delivery partner login failed: ${err.message}`);
  }

  // 11. Privilege Escalation Prevention: Customer attempting to log in as DELIVERY_PARTNER
  try {
    const fraudDeliveryRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: uniqueEmail,
        password: 'LuxuryPassword123!',
        expectedRole: 'DELIVERY_PARTNER'
      }
    });
    assert(fraudDeliveryRes.status === 403, 'Customer denied access to DELIVERY portal with 403 Forbidden');
  } catch (err) {
    assert(false, `Privilege escalation prevention failed: ${err.message}`);
  }

  // 12. Bad password returns generic 401
  try {
    const badLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: '24eg105t14@anurag.edu.in',
        password: 'WrongPassword999!'
      }
    });
    assert(badLoginRes.status === 401, 'Invalid credentials returns generic 401 Unauthorized');
  } catch (err) {
    assert(false, `Bad password check failed: ${err.message}`);
  }

  // 13. Logout endpoint clears cookie
  try {
    const logoutRes = await request('/api/auth/logout', { method: 'POST' });
    const setCookie = logoutRes.headers['set-cookie'];
    assert(
      logoutRes.status === 200 && setCookie && setCookie[0].includes('Max-Age=0'),
      'Logout successfully expires session cookie with Max-Age=0'
    );
  } catch (err) {
    assert(false, `Logout test failed: ${err.message}`);
  }

  // 14. Middleware route protection: Unauthenticated access to /admin/dashboard redirects to /admin/login
  try {
    const adminProtRes = await request('/admin/dashboard');
    assert(
      adminProtRes.status === 307 || adminProtRes.status === 308 || adminProtRes.status === 302,
      'Unauthenticated request to /admin/dashboard is redirected by Middleware'
    );
  } catch (err) {
    assert(false, `Admin route protection failed: ${err.message}`);
  }

  // 15. Middleware route protection: Unauthenticated access to /delivery/dashboard redirects to /delivery/login
  try {
    const delivProtRes = await request('/delivery/dashboard');
    assert(
      delivProtRes.status === 307 || delivProtRes.status === 308 || delivProtRes.status === 302,
      'Unauthenticated request to /delivery/dashboard is redirected by Middleware'
    );
  } catch (err) {
    assert(false, `Delivery route protection failed: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`ACCEPTANCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Give server 1 second then run
setTimeout(() => {
  runTests().catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  });
}, 1000);
