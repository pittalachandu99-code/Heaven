const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- RESETTING HEAVEN DATABASE TO CLEAN OPERATIONAL STATE ---');

  // 1. Generate secure password hashes
  const adminPasswordHash = await bcrypt.hash('chandu@8688673019', 10);
  const customerPasswordHash = await bcrypt.hash('123456', 10);
  const deliveryPasswordHash = await bcrypt.hash('DeliveryPassword123!', 10);

  // 2. Wipe all transactional data so admin dashboard starts with zero orders
  console.log('Clearing existing order and transactional history...');
  await prisma.deliveryAssignment.deleteMany({});
  await prisma.orderStatusEvent.deleteMany({});
  await prisma.paymentSimulation.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.savedAddress.deleteMany({});
  await prisma.auditLog.deleteMany({});

  // 3. Clean up non-core / test users
  console.log('Removing old test customer and administrator accounts...');
  const usersToDelete = await prisma.user.findMany({
    where: {
      email: {
        notIn: [
          '24eg105t14@anurag.edu.in',
          'pitallachandu99@gmail.com',
          'delivery@heaven.com',
        ],
      },
    },
    select: { id: true, email: true },
  });

  for (const u of usersToDelete) {
    await prisma.customerProfile.deleteMany({ where: { userId: u.id } });
    await prisma.deliveryPartnerProfile.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
    console.log(`Deleted stale account: ${u.email}`);
  }

  // 4. Upsert Administrator Account
  const adminUser = await prisma.user.upsert({
    where: { email: '24eg105t14@anurag.edu.in' },
    update: {
      passwordHash: adminPasswordHash,
      fullName: 'Chandu (Administrator)',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: '24eg105t14@anurag.edu.in',
      passwordHash: adminPasswordHash,
      fullName: 'Chandu (Administrator)',
      role: 'ADMIN',
      phone: '+91 98765 00001',
      isActive: true,
    },
  });
  console.log('Admin account ready:', adminUser.email);

  // 5. Upsert Customer Account
  const customerUser = await prisma.user.upsert({
    where: { email: 'pitallachandu99@gmail.com' },
    update: {
      passwordHash: customerPasswordHash,
      fullName: 'Chandu Pitalla',
      role: 'CUSTOMER',
      isActive: true,
    },
    create: {
      email: 'pitallachandu99@gmail.com',
      passwordHash: customerPasswordHash,
      fullName: 'Chandu Pitalla',
      role: 'CUSTOMER',
      phone: '+91 98765 00003',
      isActive: true,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: {
      preferredNotes: 'Royal Oud, Ambergris, French Rose',
    },
    create: {
      userId: customerUser.id,
      preferredNotes: 'Royal Oud, Ambergris, French Rose',
    },
  });

  // Empty cart for customer
  await prisma.cart.create({
    data: {
      userId: customerUser.id,
    },
  });
  console.log('Customer account ready:', customerUser.email);

  // 6. Upsert Delivery Partner Account
  const deliveryUser = await prisma.user.upsert({
    where: { email: 'delivery@heaven.com' },
    update: {
      passwordHash: deliveryPasswordHash,
      fullName: 'Aarav Sharma (Elite Courier)',
      role: 'DELIVERY_PARTNER',
      isActive: true,
    },
    create: {
      email: 'delivery@heaven.com',
      passwordHash: deliveryPasswordHash,
      fullName: 'Aarav Sharma (Elite Courier)',
      role: 'DELIVERY_PARTNER',
      phone: '+91 98765 00002',
      isActive: true,
    },
  });

  await prisma.deliveryPartnerProfile.upsert({
    where: { userId: deliveryUser.id },
    update: {
      vehicleType: 'Executive Climate-Controlled Van',
      vehicleNumber: 'DL-01-HV-7777',
      isAvailable: true,
      deliveriesCompleted: 0,
      rating: 4.95,
      currentLatitude: 28.6139,
      currentLongitude: 77.2090,
    },
    create: {
      userId: deliveryUser.id,
      vehicleType: 'Executive Climate-Controlled Van',
      vehicleNumber: 'DL-01-HV-7777',
      isAvailable: true,
      deliveriesCompleted: 0,
      rating: 4.95,
      currentLatitude: 28.6139,
      currentLongitude: 77.2090,
    },
  });
  console.log('Delivery Partner account ready:', deliveryUser.email);

  // 7. Reset product inventory to default 50 flacons each
  await prisma.product.updateMany({
    data: {
      stockQuantity: 50,
      lowStockThreshold: 10,
      isArchived: false,
      isPublished: true,
    },
  });
  console.log('All 16 luxury flacons reset to 50 stock units.');

  // 8. Create clean initial audit log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZE_CLEAN_STATE',
      entityType: 'STORE_OPERATIONS',
      details: JSON.stringify({
        status: 'READY_FOR_CUSTOMERS',
        ordersInitialized: 0,
        catalogueFlacons: 16,
      }),
    },
  });

  // 9. Verification Summary
  const orderCount = await prisma.order.count();
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  const deliveryAssignmentCount = await prisma.deliveryAssignment.count();

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`Active Orders in Admin: ${orderCount} (Must be 0)`);
  console.log(`Delivery Assignments: ${deliveryAssignmentCount} (Must be 0)`);
  console.log(`Catalogue Fragrances: ${productCount}`);
  console.log(`Fragrance Families/Categories: ${categoryCount}`);
  console.log(`Registered Users: ${userCount}`);
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
