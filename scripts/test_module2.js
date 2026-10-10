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
  console.log('====================================================');
  console.log('EXECUTING MODULE 2 QA SUITE & REGRESSION VERIFICATION');
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

  // --- PART 1: MODULE 1 REGRESSION TESTS ---
  console.log('\n--- PART 1: MODULE 1 REGRESSION TESTS ---');
  try {
    const home = await request('/');
    assert(home.status === 200, 'Module 1 Regression: Homepage / returns 200');

    const intro = await request('/intro');
    assert(intro.status === 200, 'Module 1 Regression: /intro returns 200');

    const adminSec = await request('/admin/dashboard');
    assert(adminSec.status === 307 || adminSec.status === 308 || adminSec.status === 302, 'Module 1 Regression: Unauthenticated /admin/dashboard blocked by middleware');

    const delivSec = await request('/delivery/dashboard');
    assert(delivSec.status === 307 || delivSec.status === 308 || delivSec.status === 302, 'Module 1 Regression: Unauthenticated /delivery/dashboard blocked by middleware');

    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: '24eg105t14@anurag.edu.in', password: 'chandu@8688673019', expectedRole: 'ADMIN' }
    });
    assert(adminLogin.status === 200 && adminLogin.data.user.role === 'ADMIN', 'Module 1 Regression: Admin login succeeds');
  } catch (err) {
    assert(false, `Module 1 regression failed: ${err.message}`);
  }

  // --- PART 2: CATALOGUE & PRODUCT APIS ---
  console.log('\n--- PART 2: CATALOGUE, SEARCH, SORTING & PRODUCT DETAILS ---');
  let sampleProduct = null;
  try {
    // 1. Fetch all products
    const prodsRes = await request('/api/products');
    assert(prodsRes.status === 200 && prodsRes.data.products.length >= 16, `Products load from database: ${prodsRes.data.products.length} products found`);
    sampleProduct = prodsRes.data.products[0];

    // 2. Search query test
    const searchRes = await request('/api/products?q=Jasmine');
    assert(searchRes.status === 200 && searchRes.data.products.some(p => p.name.includes('Jasmine')), 'Search filter works: query "Jasmine" returns matching flacons');

    // 3. Olfactive family filter test
    const familyRes = await request('/api/products?family=Floral');
    assert(
      familyRes.status === 200 && familyRes.data.products.every(p => p.fragranceFamily === 'Floral'),
      `Olfactive family filter works: all ${familyRes.data.products.length} results belong to Floral realm`
    );

    // 4. Price sorting test: price_asc
    const sortRes = await request('/api/products?sort=price_asc');
    const prices = sortRes.data.products.map(p => p.price);
    const isSorted = prices.slice(1).every((p, i) => p >= prices[i]);
    assert(sortRes.status === 200 && isSorted, 'Sorting works: price_asc sorts prices monotonically ascending');

    // 5. Product details route & API
    const slugRes = await request(`/api/products/${sampleProduct.slug}`);
    assert(
      slugRes.status === 200 && slugRes.data.product.name === sampleProduct.name && Array.isArray(slugRes.data.relatedProducts),
      `Product detail route works: retrieves ${sampleProduct.name} with olfactive notes and related recommendations`
    );

    // 6. Non-existent product slug returns 404
    const notFoundRes = await request('/api/products/non-existent-fragrance-xyz');
    assert(notFoundRes.status === 404, 'Product details route correctly returns 404 for unknown slug');

    // 7. Categories API
    const catRes = await request('/api/categories');
    assert(catRes.status === 200 && catRes.data.categories.length === 6, `Categories load from database: ${catRes.data.categories.length} categories active`);
  } catch (err) {
    assert(false, `Catalogue tests failed: ${err.message}`);
  }

  // --- PART 3: PERSISTENT CART, QUANTITY CONTROLS & DYNAMIC TOTALS ---
  console.log('\n--- PART 3: CART, DYNAMIC TOTALS & STOCK VALIDATION ---');
  let guestCookie = '';
  let addedCartItemId = '';
  try {
    // 1. Initial guest cart fetch
    const initCartRes = await request('/api/cart');
    assert(initCartRes.status === 200, 'Initial guest cart endpoint responds with 200 OK');
    const setCookie = initCartRes.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      guestCookie = setCookie[0].split(';')[0];
      assert(guestCookie.includes('heaven_guest_session='), 'Guest cart assigns persistent anonymous session cookie');
    }

    // 2. Add product to cart
    const addRes = await request('/api/cart', {
      method: 'POST',
      headers: { Cookie: guestCookie },
      body: { productId: sampleProduct.id, quantity: 1 }
    });
    assert(addRes.status === 200 && addRes.data.items.length > 0, `Added ${sampleProduct.name} to cart successfully`);
    const cartItem = addRes.data.items.find(i => i.productId === sampleProduct.id);
    addedCartItemId = cartItem ? cartItem.id : '';

    // 3. Dynamic totals verification:
    // Sample product price is e.g. 11500 (>= 5000), so shipping fee must be 0 (complimentary courier)
    const summary = addRes.data.summary;
    const expectedSubtotal = sampleProduct.price * 1;
    const expectedShipping = expectedSubtotal >= 5000 ? 0 : 250;
    const expectedTotal = expectedSubtotal + expectedShipping;
    assert(summary.subtotal === expectedSubtotal, `Cart subtotal calculated correctly on server: ₹${summary.subtotal}`);
    assert(summary.shippingFee === expectedShipping, `Complimentary shipping threshold verified: ₹${summary.shippingFee} shipping fee`);
    assert(summary.total === expectedTotal, `Final total calculated correctly: ₹${summary.total}`);

    // 4. Quantity update
    const updateRes = await request('/api/cart', {
      method: 'PATCH',
      headers: { Cookie: guestCookie },
      body: { cartItemId: addedCartItemId, quantity: 2 }
    });
    const updatedSubtotal = sampleProduct.price * 2;
    assert(
      updateRes.status === 200 && updateRes.data.summary.subtotal === updatedSubtotal,
      `Quantity updated to 2: subtotal recalculated accurately to ₹${updatedSubtotal}`
    );

    // 5. Stock validation: attempting to add more units than available in stock
    const excessQty = sampleProduct.stockQuantity + 50;
    const stockTestRes = await request('/api/cart', {
      method: 'POST',
      headers: { Cookie: guestCookie },
      body: { productId: sampleProduct.id, quantity: excessQty }
    });
    assert(
      stockTestRes.status === 400 && stockTestRes.data.error.includes('Insufficient reserve flacons'),
      `Stock enforcement works: excess reservation rejected with 400 Bad Request`
    );

    // 6. Remove item from cart
    const removeRes = await request(`/api/cart?id=${addedCartItemId}`, {
      method: 'DELETE',
      headers: { Cookie: guestCookie }
    });
    assert(
      removeRes.status === 200 && removeRes.data.items.length === 0,
      'Item removed from cart: cart emptied and totals reset to ₹0'
    );
  } catch (err) {
    assert(false, `Cart tests failed: ${err.message}`);
  }

  // --- PART 4: WISHLIST TOGGLE & RETRIEVAL ---
  console.log('\n--- PART 4: WISHLIST FUNCTIONALITY ---');
  try {
    // 1. Toggle item into wishlist
    const wishAdd = await request('/api/wishlist', {
      method: 'POST',
      headers: { Cookie: guestCookie },
      body: { productId: sampleProduct.id }
    });
    assert(wishAdd.status === 200 && wishAdd.data.isSaved === true, `Wishlist toggle: ${sampleProduct.name} saved to wishlist`);

    // 2. Fetch wishlist
    const wishGet = await request('/api/wishlist', {
      headers: { Cookie: guestCookie }
    });
    assert(wishGet.status === 200 && wishGet.data.count === 1, `Wishlist retrieval returns saved item (count: ${wishGet.data.count})`);

    // 3. Toggle again to remove
    const wishRemove = await request('/api/wishlist', {
      method: 'POST',
      headers: { Cookie: guestCookie },
      body: { productId: sampleProduct.id }
    });
    assert(wishRemove.status === 200 && wishRemove.data.isSaved === false, `Wishlist toggle again: ${sampleProduct.name} cleanly removed`);
  } catch (err) {
    assert(false, `Wishlist tests failed: ${err.message}`);
  }

  // --- PART 5: CUSTOMER ACCOUNT PROFILE ---
  console.log('\n--- PART 5: CUSTOMER ACCOUNT PROFILE & PREFERENCES ---');
  try {
    // 1. Authenticate with seeded customer account
    const custLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'pitallachandu99@gmail.com', password: '123456', expectedRole: 'CUSTOMER' }
    });
    const custCookie = custLogin.headers['set-cookie'][0].split(';')[0];
    assert(custLogin.status === 200, 'Customer logged in for account dossier tests');

    // 2. Fetch customer account
    const accRes = await request('/api/account', {
      headers: { Cookie: custCookie }
    });
    assert(accRes.status === 200 && accRes.data.user.email === 'pitallachandu99@gmail.com', 'Customer account profile retrieved');

    // 3. Update olfactory notes preferences
    const updateAcc = await request('/api/account', {
      method: 'PATCH',
      headers: { Cookie: custCookie },
      body: {
        preferredNotes: 'Damask Rose, Grasse Jasmine, Cambodian Oud',
        phone: '+91 98765 11111'
      }
    });
    assert(updateAcc.status === 200 && updateAcc.data.success === true, 'Customer olfactory preferences updated in database');
  } catch (err) {
    assert(false, `Customer account tests failed: ${err.message}`);
  }

  // --- PART 6: CUSTOMER FRONTEND PAGE ROUTES ---
  console.log('\n--- PART 6: STOREFRONT PAGE HTTP 200 CHECKS ---');
  const pages = [
    '/products',
    `/products/${sampleProduct.slug}`,
    '/categories',
    '/cart',
    '/wishlist',
    '/home'
  ];

  for (const page of pages) {
    try {
      const pageRes = await request(page);
      assert(pageRes.status === 200, `Page route ${page} responds with HTTP 200`);
    } catch (err) {
      assert(false, `Page route ${page} failed: ${err.message}`);
    }
  }

  console.log(`\n====================================================`);
  console.log(`MODULE 2 ACCEPTANCE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

setTimeout(() => {
  runTests().catch((e) => {
    console.error('Fatal error during Module 2 testing:', e);
    process.exit(1);
  });
}, 1000);
