import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create default category
  const category = await prisma.category.upsert({
    where: { name: 'Health Supplements' },
    update: {},
    create: {
      name: 'Health Supplements',
      description: 'Premium supplements for a healthy lifestyle',
    },
  });

  // Create sample products
  await prisma.product.upsert({
    where: { sku: 'NS-WHEY-001' },
    update: {
      name: 'Tulsi — Natural Heritage',
      description: 'Discover the natural heritage of tulsi with this wellness product.',
    },
    create: {
      name: 'Tulsi — Natural Heritage',
      description: 'Discover the natural heritage of tulsi with this wellness product.',
      price: 2499.00,
      stock: 100,
      sku: 'NS-WHEY-001',
      categoryId: category.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'NS-VITA-002' },
    update: {
      name: 'Moringa',
      description: 'A moringa-based wellness product for your everyday routine.',
    },
    create: {
      name: 'Moringa',
      description: 'A moringa-based wellness product for your everyday routine.',
      price: 899.00,
      stock: 200,
      sku: 'NS-VITA-002',
      categoryId: category.id,
    },
  });

  // Seed Shipping Zone and Pin Code
  const existingZone = await prisma.shippingZone.findFirst({ where: { name: 'Local Delivery' } });
  if (!existingZone) {
    await prisma.shippingZone.create({
      data: {
        name: 'Local Delivery',
        baseFee: 60.00,
        freeAbove: 999.00,
        codAllowed: true,
        pinCodes: {
          create: [
            { pinCode: '400001', deliveryDays: 2 },
            { pinCode: '110001', deliveryDays: 3 }
          ]
        }
      }
    });
    console.log('Created shipping zone with pin codes');
  }

  // Seed Coupon
  const existingCoupon = await prisma.coupon.findUnique({ where: { code: 'WELCOME10' } });
  if (!existingCoupon) {
    await prisma.coupon.create({
      data: {
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10.00,
        minOrderAmount: 500.00,
        maxUses: 100,
        isActive: true,
      }
    });
    console.log('Created WELCOME10 coupon');
  }

  // Seed Admin
  const adminEmail = process.env.ADMIN_EMAIL || (process.env.NODE_ENV === 'production' ? '' : 'admin@neelsolutions.in');
  const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin123');
  if (process.env.NODE_ENV === 'production' && (!adminEmail || adminPassword.length < 12)) {
    throw new Error('Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters before production seeding.');
  }
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log(`Created Admin user (${adminEmail})`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
