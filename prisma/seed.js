const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HEAVEN Luxury Perfume database...');

  // 1. Store Settings
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'HEAVEN',
      storeEmail: 'concierge@heavenperfume.com',
      storePhone: '+91 (0) 800-HEAVEN-0',
      shippingFee: 250.0,
      freeShippingThreshold: 5000.0,
      lowStockThreshold: 10,
      enableDemoUpi: true,
      enableDemoCard: true,
      enableDemoCod: true,
      partnerEarningPerDelivery: 180.0,
      currencySymbol: '₹',
      currencyCode: 'INR'
    }
  });

  // 2. Safe Password Hashing for Initial Seed Accounts
  const adminPassword = await bcrypt.hash('chandu@8688673019', 10);
  const deliveryPassword = await bcrypt.hash('DeliveryPassword123!', 10);
  const customerPassword = await bcrypt.hash('123456', 10);

  // Admin Account
  const admin = await prisma.user.upsert({
    where: { email: '24eg105t14@anurag.edu.in' },
    update: {
      passwordHash: adminPassword,
      fullName: 'Chandu (Administrator)',
      role: 'ADMIN',
      isActive: true
    },
    create: {
      email: '24eg105t14@anurag.edu.in',
      passwordHash: adminPassword,
      fullName: 'Chandu (Administrator)',
      role: 'ADMIN',
      phone: '+91 98765 00001',
      isActive: true
    }
  });
  console.log('Admin account created:', admin.email);

  // Delivery Partner Account
  const deliveryUser = await prisma.user.upsert({
    where: { email: 'delivery@heaven.com' },
    update: {
      passwordHash: deliveryPassword,
      fullName: 'Aarav Sharma (Elite Courier)',
      role: 'DELIVERY_PARTNER',
      isActive: true
    },
    create: {
      email: 'delivery@heaven.com',
      passwordHash: deliveryPassword,
      fullName: 'Aarav Sharma (Elite Courier)',
      role: 'DELIVERY_PARTNER',
      phone: '+91 98765 00002',
      isActive: true
    }
  });

  await prisma.deliveryPartnerProfile.upsert({
    where: { userId: deliveryUser.id },
    update: {
      vehicleType: 'Executive Climate-Controlled Van',
      vehicleNumber: 'DL-01-HV-7777',
      isAvailable: true
    },
    create: {
      userId: deliveryUser.id,
      vehicleType: 'Executive Climate-Controlled Van',
      vehicleNumber: 'DL-01-HV-7777',
      isAvailable: true,
      currentLatitude: 28.6139,
      currentLongitude: 77.2090,
      deliveriesCompleted: 142,
      rating: 4.95
    }
  });
  console.log('Delivery partner account created:', deliveryUser.email);

  // Customer Account
  const customer = await prisma.user.upsert({
    where: { email: 'pitallachandu99@gmail.com' },
    update: {
      passwordHash: customerPassword,
      fullName: 'Chandu Pitalla',
      role: 'CUSTOMER',
      isActive: true
    },
    create: {
      email: 'pitallachandu99@gmail.com',
      passwordHash: customerPassword,
      fullName: 'Chandu Pitalla',
      role: 'CUSTOMER',
      phone: '+91 98765 00003',
      isActive: true
    }
  });

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: { preferredNotes: 'Floral, Amber, Warm Sandalwood' },
    create: {
      userId: customer.id,
      preferredNotes: 'Floral, Amber, Warm Sandalwood'
    }
  });
  console.log('Customer account created:', customer.email);

  // 3. Fragrance Categories
  const categoriesData = [
    {
      name: 'Floral Haute Parfumerie',
      slug: 'floral',
      description: 'Hand-picked blooms extracted at dawn, capturing romantic elegance.'
    },
    {
      name: 'Woody & Rare Barks',
      slug: 'woody',
      description: 'Ancient sandalwood, aged cedar, and sacred balsamic resins.'
    },
    {
      name: 'Oriental & Royal Resins',
      slug: 'oriental',
      description: 'Opulent frankincense, liquid amber, and smoldering Cambodian oud.'
    },
    {
      name: 'Fresh & Aquatic Silks',
      slug: 'fresh-aquatic',
      description: 'Cool sea spray, crisp morning linen, and invigorating ozonic breezes.'
    },
    {
      name: 'Gourmand & Spices',
      slug: 'gourmand',
      description: 'Madagascan vanilla bean, freshly roasted dark roast coffee, and warm tonka.'
    },
    {
      name: 'Citrus & Botanical Leaves',
      slug: 'citrus-botanicals',
      description: 'Sun-drenched Calabrian bergamot, green tea leaves, and sparkling lemon.'
    }
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat
    });
    categoryMap[cat.slug] = createdCat.id;
  }
  console.log('Categories seeded:', Object.keys(categoryMap).length);

  // 4. Perfumes Seed Data
  const products = [
    {
      name: 'Jasmine Eau De Parfum',
      slug: 'jasmine-eau-de-parfum',
      subtitle: 'The 4K Signature Floral Absolute',
      description: 'A luminous tribute to nocturnal blooming Grandiflorum jasmine, intertwined with soft white musks and warm golden amber.',
      fragranceFamily: 'Floral',
      topNotes: 'Calabrian Bergamot, Green Mandarin, Dewy Jasmine Petals',
      heartNotes: 'Grasse Jasmine Grandiflorum, Sambac Absolute, Orange Blossom',
      baseNotes: 'Precious Amber, Cashmere Woods, White Musk',
      price: 11500,
      stockQuantity: 45,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      primaryImage: '/images/products/jasmine.jpg',
      categorySlug: 'floral'
    },
    {
      name: 'Sandalwood Sublime',
      slug: 'sandalwood-sublime',
      subtitle: 'Sacred Mysore Heartwood',
      description: 'Distilled from sustainably harvested Indian sandalwood, layered with warm cardamon and creamy cedar.',
      fragranceFamily: 'Woody',
      topNotes: 'Crushed Cardamom, Nutmeg, Violet Leaf',
      heartNotes: 'Mysore Sandalwood, Orris Root, Cedarwood',
      baseNotes: 'Bourbon Vetiver, Benzoin Resin, Creamy Vanilla',
      price: 12500,
      stockQuantity: 40,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      primaryImage: '/images/products/sandalwood.jpg',
      categorySlug: 'woody'
    },
    {
      name: 'Tahitian Vanilla',
      slug: 'tahitian-vanilla',
      subtitle: 'Pure Bourbon Extraction',
      description: 'An intoxicating gourmand blend of smoky vanilla pods, salted caramel crystals, and soft powdered heliotrope.',
      fragranceFamily: 'Gourmand',
      topNotes: 'Almond Blossom, Golden Brown Sugar, Bergamot',
      heartNotes: 'Tahitian Vanilla Caviar, Heliotrope, Orchid',
      baseNotes: 'Tonka Bean Absolute, Sandalwood, Liquid Amber',
      price: 9800,
      stockQuantity: 55,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      primaryImage: '/images/products/vanilla.jpg',
      categorySlug: 'gourmand'
    },
    {
      name: 'Sicilian Citrus',
      slug: 'sicilian-citrus',
      subtitle: 'Sun-Drenched Riviera Glow',
      description: 'A burst of crisp lemon groves, wild mint leaves, and white neroli blossoms kissed by the Mediterranean sun.',
      fragranceFamily: 'Citrus',
      topNotes: 'Sicilian Lemon, Blood Orange, Sweet Petitgrain',
      heartNotes: 'Neroli Petals, Crushed Mint, Rosemary',
      baseNotes: 'Vetiver, White Cedar, Ambergris',
      price: 8500,
      stockQuantity: 60,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      primaryImage: '/images/products/citrus.jpg',
      categorySlug: 'citrus-botanicals'
    },
    {
      name: 'Imperial Oud',
      slug: 'imperial-oud',
      subtitle: 'Royal Smoked Agarwood',
      description: 'Deep, mysterious, and unforgettable. Pure aged agarwood infused with leather, saffron filaments, and dark rose.',
      fragranceFamily: 'Oriental',
      topNotes: 'Saffron Filaments, Davana, Pink Pepper',
      heartNotes: 'Cambodian Oud Wood, Damask Rose, Birch Tar',
      baseNotes: 'Russian Leather, Dark Amber, Patchouli Leaf',
      price: 14500,
      stockQuantity: 30,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      primaryImage: '/images/products/oud.jpg',
      categorySlug: 'oriental'
    },
    {
      name: 'Smoked Coffee & Tonka',
      slug: 'smoked-coffee-tonka',
      subtitle: 'Artisanal Roastery Reserve',
      description: 'Dark roasted Arabica beans infused with bitter cacao, spicy cardamom pods, and roasted Venezuelan tonka.',
      fragranceFamily: 'Gourmand',
      topNotes: 'Dark Roasted Arabica, Bitter Cacao, Cardamom',
      heartNotes: 'Mocha Accord, Turkish Hazelnut, Cognac',
      baseNotes: 'Roasted Tonka, Smoked Birch, Golden Amber',
      price: 9200,
      stockQuantity: 38,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      primaryImage: '/images/products/coffee.jpg',
      categorySlug: 'gourmand'
    },
    {
      name: 'Kyoto Cherry Blossom',
      slug: 'kyoto-cherry-blossom',
      subtitle: 'Springtime Sakura Petals',
      description: 'Delicate pink sakura blossoms unfurling beside crystalline mountain springs and luminous white musk.',
      fragranceFamily: 'Floral',
      topNotes: 'Pink Sakura Petals, Nashi Pear, Green Apple',
      heartNotes: 'Japanese Peony, White Wisteria, Rose Petals',
      baseNotes: 'Himalayan Cedar, White Musk, Soft Sandalwood',
      price: 10200,
      stockQuantity: 50,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      primaryImage: '/images/products/cherry-blossom.jpg',
      categorySlug: 'floral'
    },
    {
      name: 'Royal Silk Musk',
      slug: 'royal-silk-musk',
      subtitle: 'Ethereal Clean Luxury',
      description: 'A second-skin whisper of immaculate white musks, soft iris petals, and warm solar amber.',
      fragranceFamily: 'Fresh',
      topNotes: 'Aldehydes, White Angelica, Bergamot',
      heartNotes: 'Florentine Iris, Cotton Flower, Lily of the Valley',
      baseNotes: 'Cashmere Musk, Clean Cedarwood, Transparent Amber',
      price: 8900,
      stockQuantity: 65,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      primaryImage: '/images/products/musk.jpg',
      categorySlug: 'fresh-aquatic'
    },
    {
      name: 'Velvet Patchouli',
      slug: 'velvet-patchouli',
      subtitle: 'Earthy Bohemian Radiance',
      description: 'Distilled Indonesian patchouli enriched with velvet moss, golden labdanum, and spicy nutmeg.',
      fragranceFamily: 'Woody',
      topNotes: 'Coriander Seed, Indonesian Nutmeg, Bergamot',
      heartNotes: 'Aged Patchouli Heart, Dark Plum, Orris',
      baseNotes: 'Oakmoss, Smoked Vetiver, Leather Accord',
      price: 9900,
      stockQuantity: 42,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      primaryImage: '/images/products/patchouli.jpg',
      categorySlug: 'woody'
    },
    {
      name: 'Golden Peach Nectar',
      slug: 'golden-peach-nectar',
      subtitle: 'Velvety Sun-Ripened Orchard',
      description: 'Luscious white peach pulp immersed in champagne bubbles, Sicilian mandarin, and warm solar musks.',
      fragranceFamily: 'Floral',
      topNotes: 'Sun-Ripened White Peach, Blood Orange, Sparkling Fizz',
      heartNotes: 'Osmanthus Blossom, Davana, Jasmine Tea',
      baseNotes: 'Sandalwood, Vanilla Bourbon, Ambergris',
      price: 8800,
      stockQuantity: 48,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      primaryImage: '/images/products/peach.jpg',
      categorySlug: 'floral'
    },
    {
      name: 'Parisian Fresh Linen',
      slug: 'parisian-fresh-linen',
      subtitle: 'Hôtel Particulier Elegance',
      description: 'Crisp Egyptian cotton drying in morning sunlight, laced with lily of the valley and pristine white cedar.',
      fragranceFamily: 'Fresh',
      topNotes: 'Morning Ozone, Crisp Aldehydes, Sweet Lemon',
      heartNotes: 'Lily of the Valley, White Freesia, Cotton Bloom',
      baseNotes: 'Blonde Cedar, Clean Musk, Ambrette Seed',
      price: 7900,
      stockQuantity: 52,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      primaryImage: '/images/products/fresh-linen.jpg',
      categorySlug: 'fresh-aquatic'
    },
    {
      name: 'Celestial Amber',
      slug: 'celestial-amber',
      subtitle: 'Golden Resin Elixir',
      description: 'Warm Baltic amber melted with vanilla bean, frankincense tears, and sacred temple woods.',
      fragranceFamily: 'Oriental',
      topNotes: 'Frankincense Tears, Cardamom, Bitter Orange',
      heartNotes: 'Baltic Amber Resin, Labdanum, Cinnamon Bark',
      baseNotes: 'Bourbon Vanilla, Benzoin, Siam Wood',
      price: 11900,
      stockQuantity: 34,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: false,
      primaryImage: '/images/products/amber.jpg',
      categorySlug: 'oriental'
    },
    {
      name: 'Kyoto Green Tea',
      slug: 'kyoto-green-tea',
      subtitle: 'Zen Bamboo Ceremony',
      description: 'Steamed Gyokuro tea leaves, ceremonial matcha froth, crisp bamboo stem, and serene white lotus.',
      fragranceFamily: 'Fresh',
      topNotes: 'Steamed Sencha Leaves, Yuzu Zest, Mint',
      heartNotes: 'Ceremonial Matcha, White Lotus, Bamboo Shoot',
      baseNotes: 'Cedarwood, Mate Leaf, Clean White Amber',
      price: 8200,
      stockQuantity: 44,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      primaryImage: '/images/products/green-tea.jpg',
      categorySlug: 'citrus-botanicals'
    },
    {
      name: 'Provençal Lavender',
      slug: 'provencal-lavender',
      subtitle: 'Sunlit Valensole Fields',
      description: 'Fine high-altitude French lavender blossoms distilled with sage leaves, tonka bean, and creamy oak.',
      fragranceFamily: 'Floral',
      topNotes: 'Valensole Lavender, Clary Sage, Bergamot',
      heartNotes: 'Lavender Absolute, Geranium Rose, Iris',
      baseNotes: 'Coumarin, Tonka Bean, Oakmoss',
      price: 8900,
      stockQuantity: 58,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      primaryImage: '/images/products/lavender.jpg',
      categorySlug: 'floral'
    },
    {
      name: 'Damask Rose Absolute',
      slug: 'damask-rose-absolute',
      subtitle: 'Queen of Grasse Flora',
      description: 'Thousands of morning-harvested centifolia rose petals distilled into a rich, velvety crimson nectar.',
      fragranceFamily: 'Floral',
      topNotes: 'Pink Peppercorn, Lychee Nectar, Morning Dew',
      heartNotes: 'Damask Rose Absolute, Grasse Centifolia, Violet',
      baseNotes: 'Guaiacwood, Amber, Silk Musk',
      price: 13200,
      stockQuantity: 28,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      primaryImage: '/images/products/rose.jpg',
      categorySlug: 'floral'
    },
    {
      name: 'Ocean Breeze Azure',
      slug: 'ocean-breeze-azure',
      subtitle: 'Aegean Sea Cliff Waters',
      description: 'Crisp saline sea minerals, crushed coastal cypress leaves, and sun-bleached driftwood.',
      fragranceFamily: 'Fresh',
      topNotes: 'Sea Salt Spray, Crushed Mint, Green Apple',
      heartNotes: 'Aegean Mineral Accord, Coastal Cypress, Rosemary',
      baseNotes: 'Sun-Bleached Driftwood, Grey Ambergris, Musk',
      price: 8700,
      stockQuantity: 62,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      primaryImage: '/images/products/ocean-breeze.jpg',
      categorySlug: 'fresh-aquatic'
    }
  ];

  for (const prod of products) {
    const categoryId = categoryMap[prod.categorySlug];
    const createdProd = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        subtitle: prod.subtitle,
        description: prod.description,
        fragranceFamily: prod.fragranceFamily,
        topNotes: prod.topNotes,
        heartNotes: prod.heartNotes,
        baseNotes: prod.baseNotes,
        price: prod.price,
        stockQuantity: prod.stockQuantity,
        isFeatured: prod.isFeatured,
        isBestSeller: prod.isBestSeller,
        isNewArrival: prod.isNewArrival,
        primaryImage: prod.primaryImage,
        categoryId: categoryId
      },
      create: {
        name: prod.name,
        slug: prod.slug,
        subtitle: prod.subtitle,
        description: prod.description,
        fragranceFamily: prod.fragranceFamily,
        topNotes: prod.topNotes,
        heartNotes: prod.heartNotes,
        baseNotes: prod.baseNotes,
        price: prod.price,
        stockQuantity: prod.stockQuantity,
        isFeatured: prod.isFeatured,
        isBestSeller: prod.isBestSeller,
        isNewArrival: prod.isNewArrival,
        primaryImage: prod.primaryImage,
        categoryId: categoryId
      }
    });

    // Record initial inventory movement if needed
    await prisma.inventoryMovement.create({
      data: {
        productId: createdProd.id,
        changeQuantity: prod.stockQuantity,
        balanceAfter: prod.stockQuantity,
        reason: 'INITIAL_STOCK',
        referenceId: admin.id
      }
    });
  }

  console.log(`Seeded ${products.length} luxury perfume products with inventory records!`);
  console.log('Database seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error('Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
