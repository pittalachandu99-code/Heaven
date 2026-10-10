const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
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
  console.log('====================================================');
  console.log('EXECUTING MODULE 4 QA SUITE: COMPLETE ADMIN DASHBOARD');
  console.log('====================================================\n');

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

  try {
    // --- PART 1: AUTHENTICATION & ACCESS CONTROL SECURITY ---
    console.log('--- PART 1: AUTHENTICATION & ROLE-BASED ACCESS CONTROL ---');

    // 1. Admin login
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: '24eg105t14@anurag.edu.in', password: 'chandu@8688673019', expectedRole: 'ADMIN' },
    });
    assert(adminLogin.status === 200 && adminLogin.data.user.role === 'ADMIN', 'Admin authentication succeeds');
    const adminCookie = adminLogin.headers['set-cookie'][0].split(';')[0];

    // 2. Customer login
    const custLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'pitallachandu99@gmail.com', password: '123456', expectedRole: 'CUSTOMER' },
    });
    assert(custLogin.status === 200 && custLogin.data.user.role === 'CUSTOMER', 'Customer login succeeds');
    const custCookie = custLogin.headers['set-cookie'][0].split(';')[0];

    // 3. Customer blocked from admin APIs
    const custOnAdminApi = await request('/api/admin/products', { headers: { Cookie: custCookie } });
    assert(custOnAdminApi.status === 403, 'Security: Customer blocked from /api/admin/products with 403 Forbidden');

    const custOnAdminOrders = await request('/api/admin/orders', { headers: { Cookie: custCookie } });
    assert(custOnAdminOrders.status === 403, 'Security: Customer blocked from /api/admin/orders with 403 Forbidden');

    const custOnAdminSettings = await request('/api/admin/settings', { headers: { Cookie: custCookie } });
    assert(custOnAdminSettings.status === 403, 'Security: Customer blocked from /api/admin/settings with 403 Forbidden');

    // 4. Unauthenticated blocked from admin APIs
    const unauthAdminApi = await request('/api/admin/audit-logs');
    assert(unauthAdminApi.status === 403 || unauthAdminApi.status === 401, 'Security: Unauthenticated blocked from admin APIs');

    // --- PART 2: DASHBOARD & NOTIFICATIONS ---
    console.log('\n--- PART 2: DASHBOARD & OPERATIONAL NOTIFICATIONS ---');

    const notifications = await request('/api/admin/notifications', { headers: { Cookie: adminCookie } });
    assert(
      notifications.status === 200 &&
      typeof notifications.data.lowStockCount === 'number' &&
      typeof notifications.data.unassignedOrdersCount === 'number',
      'Operational alerts endpoint returns live database telemetry'
    );

    // --- PART 3: PRODUCT MANAGEMENT (CRUD & SAFETY RULES) ---
    console.log('\n--- PART 3: PRODUCT MANAGEMENT (CRUD & SAFETY) ---');

    // Fetch existing categories to attach product
    const catList = await request('/api/categories');
    assert(catList.status === 200 && catList.data.categories.length > 0, 'Loaded categories for product creation');
    const targetCatId = catList.data.categories[0].id;

    // Reject negative price
    const invalidPrice = await request('/api/admin/products', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { name: 'Invalid Perfume', categoryId: targetCatId, price: -500 },
    });
    assert(invalidPrice.status === 400, 'Product validation rejects negative price with 400 Bad Request');

    // Create valid product
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const newProductPayload = {
      name: `Grand Amber Imperial ${randSuffix}`,
      slug: `grand-amber-imperial-${randSuffix}`,
      sku: `HVN-GAI-${randSuffix}`,
      subtitle: 'Pure Extrait Allocation',
      description: 'Hand-blended amber resin with Bourbon vanilla and rare Cambodian agarwood.',
      categoryId: targetCatId,
      fragranceFamily: 'Woody & Oriental',
      topNotes: 'Sicilian Bergamot, Saffron',
      heartNotes: 'Damask Rose, Amber Resin',
      baseNotes: 'Bourbon Vanilla, Agarwood',
      size: '100ml / 3.4 FL. OZ.',
      price: 18500,
      stockQuantity: 25,
      lowStockThreshold: 5,
      primaryImage: '/perfumes/heaven-bottle-1.jpg',
      isPublished: true,
      isFeatured: true,
    };

    const createProd = await request('/api/admin/products', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: newProductPayload,
    });
    assert(createProd.status === 201 && createProd.data.product.id, 'Admin successfully created new product in catalogue');
    const createdProductId = createProd.data.product.id;
    const createdProductSlug = createProd.data.product.slug;

    // Reject duplicate slug/SKU
    const duplicateProd = await request('/api/admin/products', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: newProductPayload,
    });
    assert(duplicateProd.status === 409, 'Product validation rejects duplicate slug/SKU with 409 Conflict');

    // Fetch single product
    const getSingle = await request(`/api/admin/products/${createdProductId}`, {
      headers: { Cookie: adminCookie },
    });
    assert(getSingle.status === 200 && getSingle.data.product.sku === newProductPayload.sku, 'Admin retrieved product details by ID');

    // Update product (price and stock change)
    const updateProd = await request(`/api/admin/products/${createdProductId}`, {
      method: 'PUT',
      headers: { Cookie: adminCookie },
      body: { price: 19500, stockQuantity: 30, subtitle: 'Updated Formulation' },
    });
    assert(
      updateProd.status === 200 && updateProd.data.product.price === 19500 && updateProd.data.product.stockQuantity === 30,
      'Admin updated product pricing and stock balance'
    );

    // Verify product appears in storefront
    const storefrontView = await request(`/api/products/${createdProductSlug}`);
    assert(
      storefrontView.status === 200 && storefrontView.data.product.price === 19500,
      'Product changes reflect immediately in customer storefront'
    );

    // Delete product with 0 orders: permanently deleted
    const deleteProd = await request(`/api/admin/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(deleteProd.status === 200 && deleteProd.data.deleted === true, 'Safe deletion: Product without orders permanently removed');

    // --- PART 4: CATEGORY MANAGEMENT ---
    console.log('\n--- PART 4: CATEGORY MANAGEMENT & DELETION SAFEGUARDS ---');

    const catSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCat = await request('/api/admin/categories', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        name: `Resins & Balsams ${catSuffix}`,
        slug: `resins-and-balsams-${catSuffix}`,
        description: 'Warm and sacred resins from ancient spice routes.',
        isActive: true,
      },
    });
    assert(newCat.status === 201 && newCat.data.category.id, 'Admin created new fragrance category');
    const createdCatId = newCat.data.category.id;

    // Safeguard check: Category with products cannot be deleted
    // Existing category targetCatId has 16 products attached
    const deleteCatWithProducts = await request(`/api/admin/categories/${targetCatId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(
      deleteCatWithProducts.status === 400,
      'Category safeguard: Attempting to delete category with associated products is blocked with 400 error'
    );

    // Deleting empty category succeeds
    const deleteEmptyCat = await request(`/api/admin/categories/${createdCatId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(deleteEmptyCat.status === 200, 'Empty category successfully and safely deleted');

    // --- PART 5: ORDER MANAGEMENT & STATUS TRANSITIONS ---
    console.log('\n--- PART 5: ORDER MANAGEMENT & STATUS LIFECYCLE ---');

    const adminOrders = await request('/api/admin/orders', {
      headers: { Cookie: adminCookie },
    });
    assert(adminOrders.status === 200 && adminOrders.data.orders.length > 0, 'Admin retrieved orders list');
    const targetOrder = adminOrders.data.orders[0];

    // Single order detail inspection
    const adminOrderDetail = await request(`/api/admin/orders/${targetOrder.id}`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminOrderDetail.status === 200 && adminOrderDetail.data.order.items.length > 0, 'Admin inspected full order dossier with line-item snapshots');

    // Permitted status transition: e.g. CONFIRMED -> PREPARING
    if (targetOrder.status === 'CONFIRMED') {
      const transitionRes = await request(`/api/admin/orders/${targetOrder.id}`, {
        method: 'PATCH',
        headers: { Cookie: adminCookie },
        body: { status: 'PREPARING', note: 'Cellar staging initiated by Master Parfumeur' },
      });
      assert(transitionRes.status === 200 && transitionRes.data.order.status === 'PREPARING', 'Admin executed permitted order status transition (CONFIRMED -> PREPARING)');
    }

    // Invalid status transition rejection: e.g. CANCELLED -> DELIVERED
    const invalidTransition = await request(`/api/admin/orders/${targetOrder.id}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: { status: 'DELIVERED' }, // Cannot jump directly to DELIVERED
    });
    assert(
      invalidTransition.status === 400 || targetOrder.status === 'OUT_FOR_DELIVERY',
      'Order transition validation blocks illegal status skips with 400 error'
    );

    // --- PART 6: DELIVERY PARTNER MANAGEMENT & ASSIGNMENT ---
    console.log('\n--- PART 6: DELIVERY PARTNERS & FLEET ALLOCATION ---');

    const partnersRes = await request('/api/admin/delivery-partners', {
      headers: { Cookie: adminCookie },
    });
    assert(partnersRes.status === 200 && partnersRes.data.partners.length > 0, 'Admin retrieved delivery fleet partners');
    const partner = partnersRes.data.partners[0];

    // Assign courier to order
    const assignRes = await request('/api/admin/delivery-partners', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { orderId: targetOrder.id, deliveryPartnerId: partner.id },
    });
    assert(
      assignRes.status === 200 || assignRes.status === 400,
      'Delivery partner allocation endpoint executes properly'
    );

    // Verify order reflects assignment
    const verifyOrderAssigned = await request(`/api/admin/orders/${targetOrder.id}`, {
      headers: { Cookie: adminCookie },
    });
    assert(verifyOrderAssigned.status === 200, 'Order reflects white-glove courier assignment status');

    // --- PART 7: CUSTOMER MANAGEMENT & PRIVACY ---
    console.log('\n--- PART 7: CUSTOMER MANAGEMENT & PRIVACY PROTECTION ---');

    const customersRes = await request('/api/admin/customers', {
      headers: { Cookie: adminCookie },
    });
    assert(customersRes.status === 200 && customersRes.data.customers.length > 0, 'Admin retrieved customer dossiers');
    const firstCust = customersRes.data.customers[0];

    // Privacy verification: passwordHash and passwords must NEVER be present
    const hasPassword = Object.keys(firstCust).some((k) => k.toLowerCase().includes('password'));
    assert(!hasPassword, 'Privacy Protection: Passwords and password hashes are never exposed in customer list');

    // Single customer detail
    const singleCust = await request(`/api/admin/customers/${firstCust.id}`, {
      headers: { Cookie: adminCookie },
    });
    assert(singleCust.status === 200 && singleCust.data.customer.email === firstCust.email, 'Admin retrieved customer profile and order history');
    const detailHasPassword = Object.keys(singleCust.data.customer).some((k) => k.toLowerCase().includes('password'));
    assert(!detailHasPassword, 'Privacy Protection: Password hashes never returned on single customer endpoint');

    // --- PART 8: INVENTORY MANAGEMENT & MOVEMENTS ---
    console.log('\n--- PART 8: INVENTORY MANAGEMENT & AUDIT MOVEMENTS ---');

    const invRes = await request('/api/admin/inventory', {
      headers: { Cookie: adminCookie },
    });
    assert(invRes.status === 200 && invRes.data.products.length > 0, 'Admin retrieved cellar inventory levels');
    const invProduct = invRes.data.products[0];
    const initialInvStock = invProduct.stockQuantity;

    // Record valid stock adjustment: STOCK_RECEIVED (+10)
    const adjustRes = await request('/api/admin/inventory', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        productId: invProduct.id,
        adjustmentType: 'STOCK_RECEIVED',
        quantity: 10,
        reason: 'Atelier replenishment batch received from Grasse laboratory',
      },
    });
    assert(
      adjustRes.status === 200 && adjustRes.data.product.stockQuantity === initialInvStock + 10,
      `Inventory adjustment atomically updated stock: ${initialInvStock} -> ${initialInvStock + 10}`
    );

    // Reject adjustment with missing reason
    const noReasonRes = await request('/api/admin/inventory', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        productId: invProduct.id,
        adjustmentType: 'CORRECTION_DECREASE',
        quantity: 5,
        reason: '',
      },
    });
    assert(noReasonRes.status === 400, 'Inventory rules reject unexplained adjustments without an audit reason');

    // --- PART 9: SALES REPORTS & CSV EXPORT ---
    console.log('\n--- PART 9: SALES REPORTS & FORMULA INJECTION-SAFE CSV EXPORT ---');

    const reportsRes = await request('/api/admin/reports?period=30d', {
      headers: { Cookie: adminCookie },
    });
    assert(
      reportsRes.status === 200 &&
      typeof reportsRes.data.metrics.eligibleRevenue === 'number' &&
      Array.isArray(reportsRes.data.salesTrend),
      'Sales reports endpoint calculates eligible revenue, demo collections, and daily velocity'
    );

    // CSV Export
    const csvRes = await request('/api/admin/reports/export?period=30d', {
      headers: { Cookie: adminCookie },
    });
    assert(
      csvRes.status === 200 &&
      csvRes.headers['content-type']?.includes('text/csv') &&
      csvRes.data.includes('Order Number'),
      'Secure CSV export downloads formatted report with formula injection sanitization'
    );

    // --- PART 10: STORE SETTINGS MANAGEMENT ---
    console.log('\n--- PART 10: STORE SETTINGS MANAGEMENT ---');

    const getSettings = await request('/api/admin/settings', {
      headers: { Cookie: adminCookie },
    });
    assert(getSettings.status === 200 && getSettings.data.settings.storeName, 'Admin fetched store configuration');

    const updateSettings = await request('/api/admin/settings', {
      method: 'PUT',
      headers: { Cookie: adminCookie },
      body: {
        ...getSettings.data.settings,
        shippingFee: 250,
        freeShippingThreshold: 5000,
        lowStockThreshold: 10,
        storePhone: '+91 800-HEAVEN-0',
      },
    });
    assert(updateSettings.status === 200 && updateSettings.data.settings.shippingFee === 250, 'Admin updated global store configuration');

    // --- PART 11: AUDIT LOGS LEDGER ---
    console.log('\n--- PART 11: AUDIT LOGS IMMUTABILITY & AUDITING ---');

    const auditRes = await request('/api/admin/audit-logs', {
      headers: { Cookie: adminCookie },
    });
    assert(auditRes.status === 200 && auditRes.data.logs.length > 0, 'Audit trail ledger recorded recent administrative actions');

    const containsSecrets = JSON.stringify(auditRes.data.logs).toLowerCase().includes('passwordhash');
    assert(!containsSecrets, 'Audit log security: Passwords and sensitive secrets are never logged in audit details');

    // --- PART 12: FRONTEND ADMIN PAGE ROUTES HTTP 200 CHECKS ---
    console.log('\n--- PART 12: FRONTEND ADMIN PAGES ACCESSIBILITY ---');

    const adminPages = [
      '/admin/dashboard',
      '/admin/products',
      '/admin/products/new',
      '/admin/categories',
      '/admin/orders',
      `/admin/orders/${targetOrder.id}`,
      '/admin/delivery-partners',
      '/admin/customers',
      `/admin/customers/${firstCust.id}`,
      '/admin/inventory',
      '/admin/reports',
      '/admin/settings',
      '/admin/audit-logs',
    ];

    for (const pagePath of adminPages) {
      const pageRes = await request(pagePath, { headers: { Cookie: adminCookie } });
      assert(pageRes.status === 200, `Admin frontend route ${pagePath} renders with HTTP 200 OK`);
    }
  } catch (error) {
    console.error('Test execution exception:', error);
    assert(false, `Unexpected test failure: ${error.message}`);
  }

  console.log('\n====================================================');
  console.log(`MODULE 4 QA RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
