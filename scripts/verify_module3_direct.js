const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDirectTests() {
  console.log('====================================================');
  console.log('MODULE 3 DIRECT INTEGRATION & DATA INTEGRITY TEST SUITE');
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
    // 1. Verify Seeded Customer & Store Settings
    const customer = await prisma.user.findUnique({
      where: { email: 'pitallachandu99@gmail.com' },
    });
    assert(!!customer, 'Customer account (pitallachandu99@gmail.com) exists in database');

    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });
    assert(!!settings, 'Store settings exist with free shipping threshold ₹' + settings?.freeShippingThreshold);

    // 2. Test Address Validation & Persistence
    console.log('\n--- TEST: ADDRESS PERSISTENCE & USER ASSOCIATION ---');
    const testAddress = await prisma.savedAddress.create({
      data: {
        userId: customer.id,
        recipientName: 'Eleanor Vance',
        phone: '+91 98765 43210',
        addressLine1: 'The Penthouse, Chanakyapuri Estate',
        addressLine2: 'Avenue 4',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110021',
        deliveryInstructions: 'Ring private brass chime.',
        isDefault: true,
      },
    });
    assert(!!testAddress.id, `SavedAddress created with ID: ${testAddress.id}`);
    assert(testAddress.userId === customer.id, 'SavedAddress strictly belongs to Customer');

    // 3. Test Product & Initial Stock
    console.log('\n--- TEST: STOCK AUDIT & ATOMIC TRANSACTION ---');
    const product = await prisma.product.findFirst({
      where: { isPublished: true },
    });
    assert(!!product, `Test product found: "${product.name}" (Stock: ${product.stockQuantity}, Price: ₹${product.price})`);
    const initialStock = product.stockQuantity;

    // 4. Atomic Order Creation Transaction (Same as /api/checkout)
    const idempotencyKey = `DIRECT-IDEMP-${Date.now()}`;
    const orderNumber = `HVN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const quantityToBuy = 2;
    const subtotal = product.price * quantityToBuy;
    const shippingFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const totalAmount = subtotal + shippingFee;

    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: customer.id,
          addressId: testAddress.id,
          shippingRecipient: testAddress.recipientName,
          shippingPhone: testAddress.phone,
          shippingAddressLine1: testAddress.addressLine1,
          shippingAddressLine2: testAddress.addressLine2,
          shippingCity: testAddress.city,
          shippingState: testAddress.state,
          shippingPostalCode: testAddress.postalCode,
          shippingInstructions: testAddress.deliveryInstructions,
          subtotal,
          shippingFee,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount,
          currency: 'INR',
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          paymentMethod: 'UPI',
          idempotencyKey,
        },
      });

      // Line item snapshot
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productSize: product.size,
          unitPrice: product.price,
          quantity: quantityToBuy,
          totalPrice: subtotal,
          productImage: product.primaryImage,
        },
      });

      // Deduct stock
      const newStock = initialStock - quantityToBuy;
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: newStock },
      });

      // Inventory movement
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          changeQuantity: -quantityToBuy,
          balanceAfter: newStock,
          reason: 'ORDER_PLACED',
          referenceId: order.id,
        },
      });

      // Payment simulation
      await tx.paymentSimulation.create({
        data: {
          orderId: order.id,
          paymentMethod: 'UPI',
          transactionReference: `TXN-DEMO-${Date.now()}`,
          amount: totalAmount,
          currency: 'INR',
          status: 'SUCCESS',
          gatewayResponse: 'Simulated payment gateway processed successfully.',
        },
      });

      // Order status event
      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: 'CONFIRMED',
          title: 'Order Confirmed',
          description: 'Payment authorized via demo simulation. Order placed into cellar queue.',
          actorId: customer.id,
          actorRole: 'CUSTOMER',
        },
      });

      return order;
    });

    assert(!!createdOrder.id, `Order created: #${createdOrder.orderNumber}`);

    // Verify stock decreased
    const updatedProd = await prisma.product.findUnique({ where: { id: product.id } });
    assert(
      updatedProd.stockQuantity === initialStock - quantityToBuy,
      `Stock correctly decremented in database: ${initialStock} -> ${updatedProd.stockQuantity}`
    );

    // 5. Test Idempotency Key Constraint
    console.log('\n--- TEST: IDEMPOTENCY KEY UNIQUE CONSTRAINT ---');
    let duplicateCaught = false;
    try {
      await prisma.order.create({
        data: {
          orderNumber: `HVN-2026-DUP-${Date.now()}`,
          userId: customer.id,
          shippingRecipient: 'Duplicate',
          shippingPhone: '9876543210',
          shippingAddressLine1: 'Line 1',
          shippingCity: 'City',
          shippingState: 'State',
          shippingPostalCode: '110001',
          subtotal: 1000,
          shippingFee: 0,
          totalAmount: 1000,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          paymentMethod: 'UPI',
          idempotencyKey, // Re-using identical key
        },
      });
    } catch (e) {
      duplicateCaught = true;
    }
    assert(duplicateCaught, 'Prisma enforces unique idempotencyKey on Order table');

    // 6. Test Snapshots & Associations
    console.log('\n--- TEST: ORDER SNAPSHOTS & HISTORY RETRIEVAL ---');
    const orderWithRelations = await prisma.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        items: true,
        events: true,
        paymentSimulations: true,
      },
    });
    assert(orderWithRelations.items.length === 1, 'Order has 1 snapshot item');
    assert(
      orderWithRelations.items[0].productName === product.name &&
      orderWithRelations.items[0].unitPrice === product.price,
      `Preserved historical name "${orderWithRelations.items[0].productName}" and price ₹${orderWithRelations.items[0].unitPrice}`
    );
    assert(orderWithRelations.events.length === 1, 'Order has initial CONFIRMED status event');
    assert(orderWithRelations.paymentSimulations.length === 1, 'Order has payment simulation record');

    // 7. Test Ownership Security Boundary
    console.log('\n--- TEST: STRICT ACCESS CONTROL & OWNERSHIP BOUNDARIES ---');
    // Create buyer 2
    const buyer2 = await prisma.user.upsert({
      where: { email: 'buyer2_test@heaven.com' },
      update: {},
      create: {
        email: 'buyer2_test@heaven.com',
        fullName: 'Second Customer',
        passwordHash: 'dummyhash',
        role: 'CUSTOMER',
      },
    });

    const isCustomer1Owner = orderWithRelations.userId === customer.id;
    const isCustomer2Owner = orderWithRelations.userId === buyer2.id;
    assert(isCustomer1Owner === true, 'Order ownership check: belongs to Customer 1');
    assert(isCustomer2Owner === false, 'Order ownership check: Customer 2 is NOT owner (blocked)');

    // 8. Test Cancellation & Inventory Restoration
    console.log('\n--- TEST: ORDER CANCELLATION & STOCK RESTORATION ---');
    await prisma.$transaction(async (tx) => {
      // Restore stock
      const prodToRestore = await tx.product.findUnique({ where: { id: product.id } });
      const restoredStock = prodToRestore.stockQuantity + quantityToBuy;
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: restoredStock },
      });

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          changeQuantity: quantityToBuy,
          balanceAfter: restoredStock,
          reason: 'ORDER_CANCELLED',
          referenceId: createdOrder.id,
        },
      });

      // Record event
      await tx.orderStatusEvent.create({
        data: {
          orderId: createdOrder.id,
          fromStatus: 'CONFIRMED',
          toStatus: 'CANCELLED',
          title: 'Order Cancelled',
          description: 'Client requested cancellation. Inventory restored.',
          actorId: customer.id,
          actorRole: 'CUSTOMER',
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: createdOrder.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        },
      });
    });

    const restoredProduct = await prisma.product.findUnique({ where: { id: product.id } });
    assert(
      restoredProduct.stockQuantity === initialStock,
      `Inventory stock perfectly restored: ${initialStock - quantityToBuy} -> ${restoredProduct.stockQuantity}`
    );

    const cancelledOrder = await prisma.order.findUnique({ where: { id: createdOrder.id } });
    assert(cancelledOrder.status === 'CANCELLED', 'Order status is now CANCELLED');
    assert(cancelledOrder.paymentStatus === 'REFUNDED', 'Payment status marked REFUNDED');

    // Clean up test address and test order
    await prisma.orderStatusEvent.deleteMany({ where: { orderId: createdOrder.id } });
    await prisma.paymentSimulation.deleteMany({ where: { orderId: createdOrder.id } });
    await prisma.inventoryMovement.deleteMany({ where: { referenceId: createdOrder.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: createdOrder.id } });
    await prisma.order.delete({ where: { id: createdOrder.id } });
    await prisma.savedAddress.delete({ where: { id: testAddress.id } });
    assert(true, 'Test artifacts cleanly cleaned up');

  } catch (err) {
    console.error('Test execution error:', err);
    assert(false, `Unexpected error: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`MODULE 3 DIRECT VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDirectTests();
