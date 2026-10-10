const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3000');
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function run() {
  console.log('--- VERIFYING USER CREDENTIALS, DATA CLEANLINESS & PASSWORD PRIVACY ---\n');

  // 1. Test Admin Login
  console.log('1. Testing Admin Authentication:');
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: '24eg105t14@anurag.edu.in',
      password: 'chandu@8688673019',
      expectedRole: 'ADMIN',
    },
  });
  assert(adminLogin.status === 200, 'Admin login succeeded with status 200');
  assert(adminLogin.data.user.email === '24eg105t14@anurag.edu.in', 'Admin email matches requested credentials');
  assert(adminLogin.data.user.role === 'ADMIN', 'Admin user has ADMIN role');
  assert(!adminLogin.data.user.password && !adminLogin.data.user.passwordHash, 'Password and passwordHash are NOT exposed in admin login response');

  const adminCookie = adminLogin.headers['set-cookie'][0].split(';')[0];

  // 1b. Test Bad Admin Password
  const badAdminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: '24eg105t14@anurag.edu.in',
      password: 'incorrectPassword999',
      expectedRole: 'ADMIN',
    },
  });
  assert(badAdminLogin.status === 401, 'Bad admin password rejected with generic 401');

  // 2. Test Customer Login
  console.log('\n2. Testing Customer Authentication:');
  const custLogin = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'pitallachandu99@gmail.com',
      password: '123456',
      expectedRole: 'CUSTOMER',
    },
  });
  assert(custLogin.status === 200, 'Customer login succeeded with status 200');
  assert(custLogin.data.user.email === 'pitallachandu99@gmail.com', 'Customer email matches requested credentials');
  assert(custLogin.data.user.role === 'CUSTOMER', 'Customer user has CUSTOMER role');
  assert(!custLogin.data.user.password && !custLogin.data.user.passwordHash, 'Password and passwordHash are NOT exposed in customer login response');

  const custCookie = custLogin.headers['set-cookie'][0].split(';')[0];

  // 2b. Test Bad Customer Password
  const badCustLogin = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'pitallachandu99@gmail.com',
      password: 'wrongPassword',
      expectedRole: 'CUSTOMER',
    },
  });
  assert(badCustLogin.status === 401, 'Bad customer password rejected with generic 401');

  // 3. Verify Admin Dashboard Zero Operational State
  console.log('\n3. Verifying Admin Clean State (No orders until customer creates them):');
  const adminOrders = await request('/api/admin/orders', {
    headers: { Cookie: adminCookie },
  });
  assert(adminOrders.status === 200, 'Admin orders endpoint returned 200');
  assert(adminOrders.data.orders.length === 0, `Admin orders table is empty (count: ${adminOrders.data.orders.length})`);
  assert(adminOrders.data.pagination.total === 0, 'Admin total order count is 0');

  const adminReports = await request('/api/admin/reports?period=30d', {
    headers: { Cookie: adminCookie },
  });
  assert(adminReports.status === 200, 'Admin reports endpoint returned 200');
  assert(adminReports.data.metrics.totalOrdersCount === 0, 'Admin reports total orders count is 0');
  assert(adminReports.data.metrics.eligibleRevenue === 0, 'Admin reports eligible revenue is ₹0');

  const adminDelivery = await request('/api/admin/delivery-partners', {
    headers: { Cookie: adminCookie },
  });
  assert(adminDelivery.status === 200, 'Admin delivery endpoint returned 200');
  assert(adminDelivery.data.unassignedOrders.length === 0, 'No unassigned orders in delivery queue');

  // 4. Verify Customer Privacy & Zero Orders
  console.log('\n4. Verifying Customer Privacy & Order Dossier in Admin:');
  const adminCustomers = await request('/api/admin/customers', {
    headers: { Cookie: adminCookie },
  });
  assert(adminCustomers.status === 200, 'Admin customers list returned 200');
  const registeredCust = adminCustomers.data.customers.find((c) => c.email === 'pitallachandu99@gmail.com');
  assert(!!registeredCust, 'Registered customer pitallachandu99@gmail.com found in admin customer directory');
  assert(registeredCust.orderCount === 0, `Customer orderCount is 0 (value: ${registeredCust.orderCount})`);
  assert(registeredCust.totalSpend === 0, `Customer totalSpend is 0 (value: ${registeredCust.totalSpend})`);
  assert(registeredCust.password === undefined && registeredCust.passwordHash === undefined, 'Customer password and passwordHash are NOT exposed in customer directory');

  const custDetail = await request(`/api/admin/customers/${registeredCust.id}`, {
    headers: { Cookie: adminCookie },
  });
  assert(custDetail.status === 200, 'Admin customer details returned 200');
  assert(custDetail.data.customer.password === undefined && custDetail.data.customer.passwordHash === undefined, 'Customer password and passwordHash are NOT exposed in customer dossier');
  assert(custDetail.data.customer.orders.length === 0, 'Customer has 0 orders recorded in dossier');

  // 5. Test Frontend Order Creation by Customer
  console.log('\n5. Testing End-to-End Customer Storefront Journey (Frontend Order Creation):');
  // Customer browses products
  const productsRes = await request('/api/products?limit=2');
  assert(productsRes.status === 200 && productsRes.data.products.length > 0, 'Customer storefront browses active catalogue products');
  const testProduct = productsRes.data.products[0];

  // Customer adds to cart
  const addToCart = await request('/api/cart', {
    method: 'POST',
    headers: { Cookie: custCookie },
    body: { productId: testProduct.id, quantity: 1 },
  });
  assert(addToCart.status === 200, `Customer adds flacon "${testProduct.name}" to cart`);

  // Customer creates order via checkout
  const checkoutRes = await request('/api/checkout', {
    method: 'POST',
    headers: { Cookie: custCookie },
    body: {
      newAddress: {
        recipientName: 'Chandu Pitalla',
        phone: '+91 98765 43210',
        addressLine1: 'Luxury Penthouse 42, Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400020',
      },
      paymentMethod: 'UPI',
    },
  });
  assert(checkoutRes.status === 200, `Customer successfully placed order #${checkoutRes.data.orderNumber} through storefront checkout`);
  const placedOrderNumber = checkoutRes.data.orderNumber;

  // 6. Verify Admin Dashboard Now Shows the Customer's Order
  console.log('\n6. Verifying Admin Dashboard Reflects Customer Storefront Order:');
  const adminOrdersAfter = await request('/api/admin/orders', {
    headers: { Cookie: adminCookie },
  });
  assert(adminOrdersAfter.data.orders.length === 1, 'Admin orders table now contains 1 order placed by customer');
  assert(adminOrdersAfter.data.orders[0].orderNumber === placedOrderNumber, 'Order number matches customer storefront checkout');

  const adminReportsAfter = await request('/api/admin/reports?period=30d', {
    headers: { Cookie: adminCookie },
  });
  assert(adminReportsAfter.data.metrics.totalOrdersCount === 1, 'Admin reports total orders count updated to 1');
  assert(adminReportsAfter.data.metrics.eligibleRevenue > 0, `Admin reports revenue updated to ₹${adminReportsAfter.data.metrics.eligibleRevenue}`);

  console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
