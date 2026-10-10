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

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  passedCount++;
  console.log(`✅ PASSED (${passedCount}): ${message}`);
}

async function run() {
  console.log('===============================================================');
  console.log('   HEAVEN LUXURY PERFUME — MODULE 5 COMPREHENSIVE QA SUITE');
  console.log('   DELIVERY PARTNER DASHBOARD, WORKFLOW & LIVE INTEGRATION');
  console.log('===============================================================\n');

  try {
    // --- PART 1: AUTHENTICATION & ROLE-BASED ACCESS CONTROL ---
    console.log('--- PART 1: AUTHENTICATION & ROLE-BASED ACCESS CONTROL ---');

    // 1. Authenticate Delivery Partner
    const deliveryLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'delivery@heaven.com',
        password: 'DeliveryPassword123!',
        expectedRole: 'DELIVERY_PARTNER',
      },
    });
    assert(deliveryLogin.status === 200, 'Delivery partner authenticates with HTTP 200');
    assert(deliveryLogin.data.user.role === 'DELIVERY_PARTNER', 'Delivery partner has DELIVERY_PARTNER role');
    assert(
      !deliveryLogin.data.user.password && !deliveryLogin.data.user.passwordHash,
      'Password privacy: Neither password nor hash exposed in delivery login response'
    );
    const courierCookie = deliveryLogin.headers['set-cookie'][0].split(';')[0];

    // 2. Authenticate Customer
    const custLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'pitallachandu99@gmail.com',
        password: '123456',
        expectedRole: 'CUSTOMER',
      },
    });
    assert(custLogin.status === 200, 'Customer authenticates with HTTP 200');
    const custCookie = custLogin.headers['set-cookie'][0].split(';')[0];

    // 3. Authenticate Admin
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: '24eg105t14@anurag.edu.in',
        password: 'chandu@8688673019',
        expectedRole: 'ADMIN',
      },
    });
    assert(adminLogin.status === 200, 'Administrator authenticates with HTTP 200');
    const adminCookie = adminLogin.headers['set-cookie'][0].split(';')[0];

    // 4. Role Isolation: Customer blocked from delivery APIs
    const custOnDeliveryDash = await request('/api/delivery/dashboard', {
      headers: { Cookie: custCookie },
    });
    assert(custOnDeliveryDash.status === 403, 'Security: Customer blocked from /api/delivery/dashboard with 403 Forbidden');

    const custOnDeliveryOrders = await request('/api/delivery/orders', {
      headers: { Cookie: custCookie },
    });
    assert(custOnDeliveryOrders.status === 403, 'Security: Customer blocked from /api/delivery/orders with 403 Forbidden');

    // 5. Role Isolation: Delivery Partner blocked from admin APIs
    const courierOnAdminOrders = await request('/api/admin/orders', {
      headers: { Cookie: courierCookie },
    });
    assert(courierOnAdminOrders.status === 403, 'Security: Courier partner blocked from /api/admin/orders with 403 Forbidden');

    const courierOnAdminSettings = await request('/api/admin/settings', {
      headers: { Cookie: courierCookie },
    });
    assert(courierOnAdminSettings.status === 403, 'Security: Courier partner blocked from /api/admin/settings with 403 Forbidden');

    // --- PART 2: DELIVERY DASHBOARD TELEMETRY ---
    console.log('\n--- PART 2: DELIVERY PARTNER DASHBOARD TELEMETRY ---');

    const dashRes = await request('/api/delivery/dashboard', {
      headers: { Cookie: courierCookie },
    });
    assert(dashRes.status === 200, 'Courier dashboard API returns HTTP 200');
    assert(dashRes.data.success === true, 'Courier dashboard API returns success');
    assert(dashRes.data.partner.fullName === 'Aarav Sharma (Elite Courier)', 'Partner profile contains verified courier name');
    assert(typeof dashRes.data.metrics.activeCount === 'number', 'Dashboard metrics include activeCount');
    assert(typeof dashRes.data.metrics.totalDemoEarnings === 'number', 'Dashboard metrics include totalDemoEarnings');
    assert(dashRes.data.metrics.earningPerDelivery === 180, 'Configured rate per delivery is ₹180');

    // --- PART 3: THREE-WAY INTEGRATION WORKFLOW (CUSTOMER -> ADMIN -> COURIER) ---
    console.log('\n--- PART 3: THREE-WAY INTEGRATION WORKFLOW (CUSTOMER -> ADMIN -> COURIER) ---');

    // Step A: Customer browses and buys a perfume flacon
    const prodRes = await request('/api/products?limit=1');
    assert(prodRes.status === 200 && prodRes.data.products.length > 0, 'Storefront returns active perfume flacon');
    const flacon = prodRes.data.products[0];

    const addCart = await request('/api/cart', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: { productId: flacon.id, quantity: 1 },
    });
    assert(addCart.status === 200, `Customer adds flacon "${flacon.name}" to bag`);

    const checkoutRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        newAddress: {
          recipientName: 'Chandu Pitalla',
          phone: '+91 98765 43210',
          addressLine1: 'The Oberoi Sky Villa 401, Nariman Point',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400021',
          deliveryInstructions: 'Notify private concierge prior to gate access.',
        },
        paymentMethod: 'UPI',
      },
    });
    assert(checkoutRes.status === 200, `Customer checks out order #${checkoutRes.data.orderNumber}`);
    const orderId = checkoutRes.data.orderId;
    const orderNumber = checkoutRes.data.orderNumber;

    // Step B: Admin views unassigned order in /api/admin/delivery-partners
    const adminFleetRes = await request('/api/admin/delivery-partners', {
      headers: { Cookie: adminCookie },
    });
    assert(adminFleetRes.status === 200, 'Admin accesses delivery partners and staging queue');
    const partnerId = adminFleetRes.data.partners[0].id;
    const stagedOrder = adminFleetRes.data.unassignedOrders.find((o) => o.id === orderId);
    assert(!!stagedOrder, `Order #${orderNumber} staged in admin unassigned queue awaiting white-glove driver`);

    // Step C: Admin assigns order to courier
    const assignRes = await request('/api/admin/delivery-partners', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { orderId, deliveryPartnerId: partnerId },
    });
    assert(assignRes.status === 200, `Admin successfully allocates order #${orderNumber} to courier`);

    // Step D: Courier sees assigned order in /api/delivery/orders
    const courierOrdersRes = await request('/api/delivery/orders', {
      headers: { Cookie: courierCookie },
    });
    assert(courierOrdersRes.status === 200, 'Courier queries assigned orders list');
    const assignedOrder = courierOrdersRes.data.assignments.find((a) => a.order.id === orderId);
    assert(!!assignedOrder, `Order #${orderNumber} appears in courier's assigned dispatch queue`);
    assert(assignedOrder.status === 'ASSIGNED', 'Initial assignment status is ASSIGNED');

    // Step E: Courier opens detailed fulfillment console
    const orderDetailRes = await request(`/api/delivery/orders/${orderId}`, {
      headers: { Cookie: courierCookie },
    });
    assert(orderDetailRes.status === 200, 'Courier accesses single order fulfillment console');
    assert(orderDetailRes.data.order.pickupOrigin.name === 'HEAVEN Maison Flagship Atelier', 'Pickup origin specifies HEAVEN Flagship Atelier');
    assert(orderDetailRes.data.order.shippingRecipient === 'Chandu Pitalla', 'Destination specifies recipient Chandu Pitalla');
    assert(orderDetailRes.data.order.items.length >= 1, 'Manifest lists luxury flacon items');

    // --- PART 4: DELIVERY WORKFLOW & STATE TRANSITIONS ---
    console.log('\n--- PART 4: DELIVERY WORKFLOW & STATE TRANSITIONS ---');

    // 1. Confirm Pickup
    const pickupRes = await request(`/api/delivery/orders/${orderId}/action`, {
      method: 'POST',
      headers: { Cookie: courierCookie },
      body: { action: 'pickup' },
    });
    assert(pickupRes.status === 200, 'Courier confirms pickup: Status transitions to PICKED_UP');
    assert(pickupRes.data.order.status === 'PICKED_UP', 'Order record updated to PICKED_UP');

    // 2. Reject Invalid State Transition (e.g. Cannot pickup again)
    const duplicatePickup = await request(`/api/delivery/orders/${orderId}/action`, {
      method: 'POST',
      headers: { Cookie: courierCookie },
      body: { action: 'pickup' },
    });
    assert(duplicatePickup.status === 400, 'Workflow Rule: Duplicate pickup rejected with 400 Bad Request');

    // 3. Mark Out for Delivery
    const outForDeliveryRes = await request(`/api/delivery/orders/${orderId}/action`, {
      method: 'POST',
      headers: { Cookie: courierCookie },
      body: { action: 'out_for_delivery' },
    });
    assert(outForDeliveryRes.status === 200, 'Courier marks order OUT_FOR_DELIVERY');
    assert(outForDeliveryRes.data.order.status === 'OUT_FOR_DELIVERY', 'Order status updated to OUT_FOR_DELIVERY');

    // 4. Update Live GPS Telemetry
    const locationUpdate = await request('/api/delivery/location', {
      method: 'POST',
      headers: { Cookie: courierCookie },
      body: { latitude: 28.5912, longitude: 77.1955 },
    });
    assert(locationUpdate.status === 200, 'Courier transmits live GPS coordinates (28.5912° N, 77.1955° E)');
    assert(locationUpdate.data.location.latitude === 28.5912, 'Persisted latitude verified');

    // 5. Test Coordinate Validation (Bounds check)
    const badCoords = await request('/api/delivery/location', {
      method: 'POST',
      headers: { Cookie: courierCookie },
      body: { latitude: 150.0, longitude: 200.0 },
    });
    assert(badCoords.status === 400, 'Security: Out-of-bounds geographic coordinates rejected with 400');

    // 6. Verify Customer Order Tracking Telemetry Sync
    const custTrackRes = await request(`/api/orders/${orderId}`, {
      headers: { Cookie: custCookie },
    });
    assert(custTrackRes.status === 200, 'Customer fetches updated order telemetry');
    assert(custTrackRes.data.order.status === 'OUT_FOR_DELIVERY', 'Customer sees live status OUT_FOR_DELIVERY');
    assert(
      custTrackRes.data.order.deliveryAssignment.deliveryPartner.user.fullName === 'Aarav Sharma (Elite Courier)',
      'Customer sees assigned courier Aarav Sharma'
    );
    const lastEvent = custTrackRes.data.order.events[custTrackRes.data.order.events.length - 1];
    assert(lastEvent.toStatus === 'OUT_FOR_DELIVERY', 'Custody timeline event reflects transit milestone');

    // 7. Confirm Final Handover & Delivery Completion
    const deliverRes = await request(`/api/delivery/orders/${orderId}/action`, {
      method: 'POST',
      headers: { Cookie: courierCookie },
      body: {
        action: 'delivered',
        handoverNotes: 'Handed directly to client at penthouse foyer. Digital acknowledgment verified.',
      },
    });
    assert(deliverRes.status === 200, 'Courier confirms final delivery: Status transitions to DELIVERED');
    assert(deliverRes.data.order.status === 'DELIVERED', 'Order status updated to DELIVERED');

    // 8. Prevent Duplicate Delivery Completion
    const duplicateDelivery = await request(`/api/delivery/orders/${orderId}/action`, {
      method: 'POST',
      headers: { Cookie: courierCookie },
      body: { action: 'delivered' },
    });
    assert(duplicateDelivery.status === 400, 'Workflow Rule: Duplicate delivery completion prevented with 400');

    // --- PART 5: DEMO EARNINGS & DELIVERY HISTORY ARCHIVE ---
    console.log('\n--- PART 5: DEMO EARNINGS & DELIVERY HISTORY ARCHIVE ---');

    const earningsRes = await request('/api/delivery/earnings?period=30d', {
      headers: { Cookie: courierCookie },
    });
    assert(earningsRes.status === 200, 'Courier fetches demo earnings telemetry');
    assert(earningsRes.data.summary.totalEarnings >= 180, 'Demo earnings include completed delivery (>= ₹180)');
    assert(earningsRes.data.summary.completedCount >= 1, 'Completed deliveries count reflects fulfilled run');
    assert(earningsRes.data.summary.isSimulation === true, 'Clear demonstration labeling flag present');
    assert(
      typeof earningsRes.data.summary.disclaimer === 'string',
      'Disclaimer specifies operational simulation with no banking obligations'
    );
    const historyItem = earningsRes.data.deliveries.find((d) => d.orderId === orderId);
    assert(!!historyItem, 'Delivered order appears in completed run breakdown');
    assert(historyItem.demoEarnings === 180, 'Credited demo fee is ₹180');

    // --- PART 6: EXCEPTION / ISSUE HANDLING WORKFLOW ---
    console.log('\n--- PART 6: EXCEPTION & ISSUE HANDLING WORKFLOW ---');

    // Create another order for issue testing
    await request('/api/cart', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: { productId: flacon.id, quantity: 1 },
    });

    const checkout2 = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        newAddress: {
          recipientName: 'Lady Victoria Sterling',
          phone: '+91 98765 00003',
          addressLine1: 'Embassy Row 12, Diplomatic Enclave',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110021',
        },
        paymentMethod: 'CARD',
      },
    });
    const order2Id = checkout2.data.orderId;

    // Admin assigns order 2
    await request('/api/admin/delivery-partners', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { orderId: order2Id, deliveryPartnerId: partnerId },
    });

    // Courier reports delivery issue
    const issueRes = await request(`/api/delivery/orders/${order2Id}/action`, {
      method: 'POST',
      headers: { Cookie: courierCookie },
      body: {
        action: 'issue',
        issueReason: 'CUSTOMER_UNAVAILABLE',
        issueNotes: 'Gate security noted resident traveling. Reschedule suggested.',
      },
    });
    assert(issueRes.status === 200, 'Courier submits delivery exception report');
    assert(issueRes.data.order.status === 'DELIVERY_FAILED', 'Order status updated to DELIVERY_FAILED (retained for admin review)');

    // Verify order 2 still exists and was not deleted
    const adminOrder2 = await request(`/api/admin/orders/${order2Id}`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminOrder2.status === 200, 'Admin can inspect order with DELIVERY_FAILED status');
    assert(adminOrder2.data.order.status === 'DELIVERY_FAILED', 'Admin sees DELIVERY_FAILED status in order management');

    // --- PART 7: COURIER PROFILE & FLEET CONFIGURATION ---
    console.log('\n--- PART 7: COURIER PROFILE & FLEET CONFIGURATION ---');

    const profileRes = await request('/api/delivery/profile', {
      headers: { Cookie: courierCookie },
    });
    assert(profileRes.status === 200, 'Courier retrieves profile coordinates');
    assert(profileRes.data.profile.fullName === 'Aarav Sharma (Elite Courier)', 'Profile returns verified courier name');

    // Update fleet vehicle and availability
    const updateProfileRes = await request('/api/delivery/profile', {
      method: 'PATCH',
      headers: { Cookie: courierCookie },
      body: {
        vehicleType: 'Executive Climate-Controlled Van V2',
        vehicleNumber: 'DL-01-HV-9999',
        isAvailable: true,
        phone: '+91 98765 77777',
      },
    });
    assert(updateProfileRes.status === 200, 'Courier updates vehicle type and telephone number');
    assert(
      updateProfileRes.data.profile.vehicleType === 'Executive Climate-Controlled Van V2',
      'Updated vehicle type persisted'
    );
    assert(
      updateProfileRes.data.profile.vehicleNumber === 'DL-01-HV-9999',
      'Updated vehicle license number persisted'
    );

    console.log('\n===============================================================');
    console.log(`   MODULE 5 TEST RESULTS: ${passedCount} / ${totalCount} ASSERTIONS PASSED!`);
    console.log('===============================================================\n');
  } catch (err) {
    console.error('\n❌ Module 5 QA test aborted on failure:', err.message);
    process.exit(1);
  }
}

run();
