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
  console.log('EXECUTING MODULE 3 QA SUITE: CHECKOUT, PAYMENTS & ORDERS');
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
    // --- AUTHENTICATION SETUP ---
    console.log('--- SETUP: AUTHENTICATION FOR CUSTOMERS ---');
    
    // Customer 1: Seeded customer
    const login1 = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'pitallachandu99@gmail.com', password: '123456', expectedRole: 'CUSTOMER' },
    });
    assert(login1.status === 200, 'Customer 1 (pitallachandu99@gmail.com) authenticated successfully');
    const cookieCust1 = login1.headers['set-cookie'] ? login1.headers['set-cookie'][0].split(';')[0] : '';

    // Customer 2: Register a second customer for strict ownership boundary testing
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const reg2 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        email: `buyer${randSuffix}@heaven-test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: `Test Buyer ${randSuffix}`,
        phone: '+91 98765 00000',
      },
    });
    assert(reg2.status === 201 || reg2.status === 200, 'Customer 2 registered for security ownership boundary checks');
    const cookieCust2 = reg2.headers['set-cookie'] ? reg2.headers['set-cookie'][0].split(';')[0] : '';

    // --- PART 1: DELIVERY ADDRESS MANAGEMENT & VALIDATION ---
    console.log('\n--- PART 1: ADDRESS MANAGEMENT & VALIDATION ---');
    
    // 1. Invalid address validation (missing fields)
    const invalidAddr = await request('/api/addresses', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: { recipientName: '', phone: '123' },
    });
    assert(invalidAddr.status === 400, 'Server rejects incomplete address submission (missing name/street/city)');

    // 2. Invalid phone / postal code validation
    const invalidPhonePin = await request('/api/addresses', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: {
        recipientName: 'Valid Name',
        phone: '12345',
        addressLine1: '123 Luxury Lane',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '999', // Invalid PIN
      },
    });
    assert(invalidPhonePin.status === 400, 'Server validates phone format and 6-digit PIN code');

    // 3. Valid address creation for Customer 1
    const validAddr = await request('/api/addresses', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: {
        recipientName: 'Eleanor Vance',
        phone: '+91 98765 43210',
        addressLine1: 'Apt 14B, Chanakyapuri Residences',
        addressLine2: 'Near Embassy Quarter',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110021',
        deliveryInstructions: 'Ring private brass chime; hand to concierge.',
        isDefault: true,
      },
    });
    assert((validAddr.status === 200 || validAddr.status === 201) && validAddr.data.address?.id, 'Customer 1 saved delivery address created successfully');
    const savedAddressId = validAddr.data.address?.id;

    // 4. Fetch customer addresses
    const getAddrs = await request('/api/addresses', {
      headers: { Cookie: cookieCust1 },
    });
    assert(
      getAddrs.status === 200 && getAddrs.data.addresses.some((a) => a.id === savedAddressId),
      'Customer 1 retrieved saved addresses containing newly created address'
    );

    // --- PART 2: CHECKOUT CART PREPARATION & STOCK VERIFICATION ---
    console.log('\n--- PART 2: CATALOGUE PRODUCTS & CART SETUP ---');
    
    const prodsRes = await request('/api/products');
    assert(prodsRes.status === 200 && prodsRes.data.products.length > 0, 'Loaded perfume catalogue from database');
    const testProduct = prodsRes.data.products[0];
    const initialStock = testProduct.stockQuantity;
    console.log(`Selected flacon: "${testProduct.name}" (Initial stock: ${initialStock}, Price: ₹${testProduct.price})`);

    // Empty cart checkout attempt
    // First clear customer 1 cart if any
    const cartRes = await request('/api/cart', { headers: { Cookie: cookieCust1 } });
    if (cartRes.data?.items?.length > 0) {
      for (const item of cartRes.data.items) {
        await request(`/api/cart?cartItemId=${item.id}`, { method: 'DELETE', headers: { Cookie: cookieCust1 } });
      }
    }

    const emptyCheckout = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: { addressId: savedAddressId, paymentMethod: 'UPI' },
    });
    assert(emptyCheckout.status === 400, 'Checkout rejects empty cart with appropriate error');

    // Add product to Customer 1's cart
    const addCart = await request('/api/cart', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: { productId: testProduct.id, quantity: 2 },
    });
    assert(addCart.status === 200 && addCart.data.items.length > 0, `Added 2 flacons of ${testProduct.name} to cart`);

    // --- PART 3: SIMULATED PAYMENT FAILURE TEST ---
    console.log('\n--- PART 3: SIMULATED PAYMENT DECLINE HANDLING ---');
    
    const failPayment = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: {
        addressId: savedAddressId,
        paymentMethod: 'CARD',
        simulateOutcome: 'FAILED',
        idempotencyKey: `FAIL-KEY-${Date.now()}`,
      },
    });
    assert(
      failPayment.status === 400 && failPayment.data.paymentFailed === true,
      'Payment simulation failure returns 400 with helpful decline notice'
    );

    // Verify stock was NOT deducted during payment failure
    const checkProductAfterFail = await request(`/api/products/${testProduct.slug}`);
    assert(
      checkProductAfterFail.data.product.stockQuantity === initialStock,
      'Stock integrity preserved: inventory was NOT deducted during failed payment'
    );

    // --- PART 4: SUCCESSFUL CHECKOUT & ATOMIC INVENTORY DEDUCTION ---
    console.log('\n--- PART 4: SUCCESSFUL ORDER CREATION & ATOMICITY ---');
    
    const testIdempotencyKey = `HVN-IDEMPOTENT-${Date.now()}`;
    const checkoutSuccess = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: {
        addressId: savedAddressId,
        paymentMethod: 'UPI',
        simulateOutcome: 'SUCCESS',
        idempotencyKey: testIdempotencyKey,
      },
    });

    assert(
      checkoutSuccess.status === 200 && checkoutSuccess.data.success === true && checkoutSuccess.data.orderId,
      `Order placed successfully: Order #${checkoutSuccess.data.orderNumber} created`
    );
    const createdOrderId = checkoutSuccess.data.orderId;
    const createdOrderNumber = checkoutSuccess.data.orderNumber;

    // Verify stock was deducted by exactly 2
    const checkProductAfterSuccess = await request(`/api/products/${testProduct.slug}`);
    assert(
      checkProductAfterSuccess.data.product.stockQuantity === initialStock - 2,
      `Inventory stock deducted atomically: ${initialStock} -> ${initialStock - 2}`
    );

    // Verify cart was cleared after successful order placement
    const cartAfterOrder = await request('/api/cart', { headers: { Cookie: cookieCust1 } });
    assert(
      cartAfterOrder.status === 200 && cartAfterOrder.data.items.length === 0,
      'Purchased items were cleanly cleared from cart upon order creation'
    );

    // --- PART 5: IDEMPOTENCY PROTECTION ---
    console.log('\n--- PART 5: IDEMPOTENCY PROTECTION ---');
    
    const duplicateSubmission = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: {
        addressId: savedAddressId,
        paymentMethod: 'UPI',
        simulateOutcome: 'SUCCESS',
        idempotencyKey: testIdempotencyKey, // Re-submitting identical idempotency key
      },
    });
    assert(
      duplicateSubmission.status === 200 && duplicateSubmission.data.orderId === createdOrderId,
      'Idempotency key prevents duplicate order creation and re-returns original order'
    );

    // Re-verify stock didn't get deducted a second time
    const checkProductAfterIdempotency = await request(`/api/products/${testProduct.slug}`);
    assert(
      checkProductAfterIdempotency.data.product.stockQuantity === initialStock - 2,
      'Idempotency verified: inventory was NOT deducted a second time'
    );

    // --- PART 6: ORDER DETAILS & SNAPSHOTS ---
    console.log('\n--- PART 6: ORDER DETAILS, TIMELINE & PRICE SNAPSHOTS ---');
    
    const orderDetailsRes = await request(`/api/orders/${createdOrderId}`, {
      headers: { Cookie: cookieCust1 },
    });
    assert(orderDetailsRes.status === 200, 'Order details endpoint responded with 200 OK');
    const orderData = orderDetailsRes.data.order;

    assert(orderData.orderNumber === createdOrderNumber, `Order number matches: #${orderData.orderNumber}`);
    assert(orderData.status === 'CONFIRMED', `Initial order status is CONFIRMED (received: ${orderData.status})`);
    assert(orderData.items.length === 1, `Order contains 1 line item snapshot with qty 2`);
    assert(
      orderData.items[0].productName === testProduct.name && orderData.items[0].unitPrice === testProduct.price,
      `Snapshot preserves exact product name "${orderData.items[0].productName}" and unit price ₹${orderData.items[0].unitPrice}`
    );
    assert(orderData.events.length >= 1, `Audit dispatch event recorded for order placement`);

    // --- PART 7: STRICT CUSTOMER OWNERSHIP & ACCESS CONTROL ---
    console.log('\n--- PART 7: STRICT CUSTOMER OWNERSHIP & SECURITY ---');
    
    // Customer 2 attempts to view Customer 1's order
    const unauthorizedView = await request(`/api/orders/${createdOrderId}`, {
      headers: { Cookie: cookieCust2 },
    });
    assert(
      unauthorizedView.status === 403,
      'Security Boundary: Customer 2 is blocked with 403 Forbidden when viewing Customer 1 order'
    );

    // Customer 2 attempts to cancel Customer 1's order
    const unauthorizedCancel = await request(`/api/orders/${createdOrderId}/cancel`, {
      method: 'POST',
      headers: { Cookie: cookieCust2 },
    });
    assert(
      unauthorizedCancel.status === 403,
      'Security Boundary: Customer 2 is blocked with 403 Forbidden when cancelling Customer 1 order'
    );

    // Customer 2 attempts to delete Customer 1's address
    const unauthorizedAddrDelete = await request(`/api/addresses?addressId=${savedAddressId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieCust2 },
    });
    assert(
      unauthorizedAddrDelete.status === 403 || unauthorizedAddrDelete.status === 400 || unauthorizedAddrDelete.status === 404,
      'Security Boundary: Customer 2 cannot delete Customer 1 address'
    );

    // Unauthenticated request to order history
    const unauthOrders = await request('/api/orders');
    assert(unauthOrders.status === 401, 'Unauthenticated request to /api/orders blocked with 401 Unauthorized');

    // Customer 1 order history retrieval
    const cust1Orders = await request('/api/orders', {
      headers: { Cookie: cookieCust1 },
    });
    assert(
      cust1Orders.status === 200 && cust1Orders.data.orders.some((o) => o.id === createdOrderId),
      'Customer 1 order history lists the created order'
    );

    // --- PART 8: ORDER CANCELLATION & INVENTORY RESTORATION ---
    console.log('\n--- PART 8: ORDER CANCELLATION & STOCK RESTORATION ---');
    
    const cancelRes = await request(`/api/orders/${createdOrderId}/cancel`, {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
    });
    assert(cancelRes.status === 200 && cancelRes.data.success === true, 'Customer 1 cancelled order successfully');

    // Verify status updated to CANCELLED
    const cancelledOrderDetails = await request(`/api/orders/${createdOrderId}`, {
      headers: { Cookie: cookieCust1 },
    });
    assert(
      cancelledOrderDetails.data.order.status === 'CANCELLED',
      'Order status updated to CANCELLED in database'
    );

    // Verify inventory restored
    const checkProductAfterCancel = await request(`/api/products/${testProduct.slug}`);
    assert(
      checkProductAfterCancel.data.product.stockQuantity === initialStock,
      `Inventory restored upon cancellation: ${initialStock - 2} -> ${checkProductAfterCancel.data.product.stockQuantity}`
    );

    // Attempting to cancel already cancelled order returns 400
    const reCancelRes = await request(`/api/orders/${createdOrderId}/cancel`, {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
    });
    assert(
      reCancelRes.status === 400,
      'Business Rule: Re-cancelling an already cancelled order returns 400 error'
    );

    // --- PART 9: CASH ON DELIVERY & CARD PAYMENT SUPPORT ---
    console.log('\n--- PART 9: CASH ON DELIVERY (COD) ORDER PLACEMENT ---');
    
    // Add item to cart again
    await request('/api/cart', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: { productId: testProduct.id, quantity: 1 },
    });

    const codOrderRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: cookieCust1 },
      body: {
        addressId: savedAddressId,
        paymentMethod: 'COD',
        simulateOutcome: 'SUCCESS',
        idempotencyKey: `COD-ORDER-${Date.now()}`,
      },
    });
    assert(
      codOrderRes.status === 200 && codOrderRes.data.paymentStatus === 'COD_PENDING',
      'COD payment simulation sets paymentStatus to COD_PENDING'
    );

    // --- PART 10: FRONTEND ROUTES VERIFICATION ---
    console.log('\n--- PART 10: FRONTEND ROUTES AVAILABILITY ---');
    
    const unauthCheckout = await request('/checkout');
    assert(
      unauthCheckout.status === 307 || unauthCheckout.status === 308 || unauthCheckout.status === 302,
      'Route guard: Unauthenticated /checkout safely redirects to login via middleware'
    );

    const authCheckout = await request('/checkout', { headers: { Cookie: cookieCust1 } });
    assert(authCheckout.status === 200, 'Frontend route /checkout renders with 200 OK for authenticated customer');

    const ordersPage = await request('/orders', { headers: { Cookie: cookieCust1 } });
    assert(ordersPage.status === 200, 'Frontend route /orders renders with 200 OK');

    const orderDetailPage = await request(`/orders/${createdOrderId}`, { headers: { Cookie: cookieCust1 } });
    assert(orderDetailPage.status === 200, 'Frontend route /orders/[orderId] renders with 200 OK');

    const trackPage = await request(`/track/${createdOrderId}`, { headers: { Cookie: cookieCust1 } });
    assert(trackPage.status === 200, 'Frontend route /track/[orderId] renders with 200 OK');

    const accountPage = await request('/account', { headers: { Cookie: cookieCust1 } });
    assert(accountPage.status === 200, 'Frontend route /account renders with 200 OK');
  } catch (error) {
    console.error('Test execution exception:', error);
    assert(false, `Unexpected test failure: ${error.message}`);
  }

  console.log('\n====================================================');
  console.log(`MODULE 3 QA RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
