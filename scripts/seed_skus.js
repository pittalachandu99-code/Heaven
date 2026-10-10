const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateSkus() {
  const products = await prisma.product.findMany();
  for (let i = 0; i < products.length; i++) {
    if (!products[i].sku) {
      const prefix = products[i].slug.substring(0, 3).toUpperCase();
      const sku = `HVN-${prefix}-${String(i + 1).padStart(3, '0')}`;
      await prisma.product.update({
        where: { id: products[i].id },
        data: { sku },
      });
    }
  }
  console.log(`SKUs initialized for ${products.length} products`);
  await prisma.$disconnect();
}

populateSkus();
