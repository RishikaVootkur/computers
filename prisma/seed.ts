import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"
import { Pool } from "pg"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

dotenv.config()

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  })

  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter } as any)

  console.log("Seeding database...")

  const shop = await prisma.shop.upsert({
    where: { id: (await prisma.shop.findFirst())?.id ?? "nonexistent" },
    update: {},
    create: {
      name: "Rishika Computers",
      address: "16-11-740/9/1, Rudra Towers, Dilsukh Nagar, Hyderabad - 500060",
      phone: "040-XXXXXXXX",
      email: "rishikacomputers@gmail.com",
    },
  })

  console.log("Shop:", shop.name)

  const hashedPassword = await bcrypt.hash("owner123", 10)

  const owner = await prisma.user.upsert({
    where: { email: "krishna@rishikacomputers.com" },
    update: {},
    create: {
      shopId: shop.id,
      name: "Krishna Reddy",
      email: "krishna@rishikacomputers.com",
      password: hashedPassword,
      role: "OWNER",
      phone: "9999999999",
    },
  })

  console.log("Owner:", owner.name)
  console.log("Email:", owner.email)
  console.log("Password: owner123")

  // ── Sales Module Seed Data ──────────────────────────────────────────────────
  const existingSuppliers = await prisma.supplier.count({ where: { shopId: shop.id } })
  if (existingSuppliers > 0) {
    console.log("Sales seed data already exists, skipping.")
    await prisma.$disconnect()
    await pool.end()
    return
  }

  // Suppliers
  const [supplier1, supplier2, supplier3] = await Promise.all([
    prisma.supplier.create({
      data: { shopId: shop.id, name: "Tech Hub Distributors", phone: "9876543210", email: "sales@techhub.in", address: "Secunderabad, Hyderabad", gstin: "36AABCT1234C1Z5" },
    }),
    prisma.supplier.create({
      data: { shopId: shop.id, name: "Prime Components Pvt Ltd", phone: "9123456789", email: "info@primecomp.in", address: "Begumpet, Hyderabad" },
    }),
    prisma.supplier.create({
      data: { shopId: shop.id, name: "Digital World Traders", phone: "9000012345", address: "Ameerpet, Hyderabad" },
    }),
  ])
  console.log("Suppliers created: 3")

  // Categories
  const [catRAM, catStorage, catDisplay, catCooling, catPower, catNetwork, catPeripherals] = await Promise.all([
    prisma.productCategory.create({ data: { shopId: shop.id, name: "RAM" } }),
    prisma.productCategory.create({ data: { shopId: shop.id, name: "Storage" } }),
    prisma.productCategory.create({ data: { shopId: shop.id, name: "Display" } }),
    prisma.productCategory.create({ data: { shopId: shop.id, name: "Cooling" } }),
    prisma.productCategory.create({ data: { shopId: shop.id, name: "Power Supply" } }),
    prisma.productCategory.create({ data: { shopId: shop.id, name: "Networking" } }),
    prisma.productCategory.create({ data: { shopId: shop.id, name: "Peripherals" } }),
  ])
  console.log("Categories created: 7")

  // Products
  const products = await Promise.all([
    prisma.product.create({ data: { shopId: shop.id, name: "RAM 8GB DDR4 3200MHz", sku: "RAM-8G-DDR4", categoryId: catRAM.id, supplierId: supplier1.id, costPrice: 1200, sellPrice: 1599, stock: 15, minStock: 3 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "RAM 16GB DDR4 3200MHz", sku: "RAM-16G-DDR4", categoryId: catRAM.id, supplierId: supplier1.id, costPrice: 2400, sellPrice: 3199, stock: 8, minStock: 2 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "SSD 256GB SATA", sku: "SSD-256-SATA", categoryId: catStorage.id, supplierId: supplier2.id, costPrice: 1800, sellPrice: 2399, stock: 10, minStock: 3 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "SSD 512GB NVMe", sku: "SSD-512-NVME", categoryId: catStorage.id, supplierId: supplier2.id, costPrice: 3200, sellPrice: 4199, stock: 6, minStock: 2 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "HDD 1TB 7200RPM", sku: "HDD-1TB", categoryId: catStorage.id, supplierId: supplier2.id, costPrice: 2800, sellPrice: 3499, stock: 5, minStock: 2 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "Laptop Cooling Pad", sku: "COOL-PAD-01", categoryId: catCooling.id, supplierId: supplier3.id, costPrice: 650, sellPrice: 999, stock: 12, minStock: 3 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "Thermal Paste 5g", sku: "THERMAL-5G", categoryId: catCooling.id, supplierId: supplier1.id, costPrice: 80, sellPrice: 149, stock: 20, minStock: 5 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "SMPS 450W 80+ Bronze", sku: "PSU-450W", categoryId: catPower.id, supplierId: supplier1.id, costPrice: 2200, sellPrice: 2999, stock: 4, minStock: 2 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "WiFi USB Adapter 300Mbps", sku: "WIFI-USB-300", categoryId: catNetwork.id, supplierId: supplier3.id, costPrice: 350, sellPrice: 599, stock: 18, minStock: 5 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "USB Hub 4-Port 3.0", sku: "USB-HUB-4P", categoryId: catPeripherals.id, supplierId: supplier3.id, costPrice: 280, sellPrice: 499, stock: 14, minStock: 3 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "HDMI Cable 1.8m", sku: "HDMI-18M", categoryId: catDisplay.id, supplierId: supplier3.id, costPrice: 120, sellPrice: 249, stock: 25, minStock: 5 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "VGA to HDMI Adapter", sku: "VGA-HDMI-ADT", categoryId: catDisplay.id, supplierId: supplier3.id, costPrice: 180, sellPrice: 349, stock: 8, minStock: 2 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "Keyboard USB Wired", sku: "KB-USB-01", categoryId: catPeripherals.id, supplierId: supplier2.id, costPrice: 350, sellPrice: 599, stock: 2, minStock: 3 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "Optical Mouse USB", sku: "MOUSE-USB-01", categoryId: catPeripherals.id, supplierId: supplier2.id, costPrice: 180, sellPrice: 299, stock: 7, minStock: 3 } }),
    prisma.product.create({ data: { shopId: shop.id, name: "Laptop Charger 65W Universal", sku: "CHRG-65W-UNV", categoryId: catPower.id, supplierId: supplier1.id, costPrice: 750, sellPrice: 1199, stock: 5, minStock: 2 } }),
  ])
  console.log("Products created: 15")

  // Sample Purchases
  const po1 = await prisma.purchase.create({
    data: {
      shopId: shop.id,
      supplierId: supplier1.id,
      purchaseNumber: "PO-0001",
      totalAmount: 28400,
      status: "RECEIVED",
      purchasedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: products[0].id, quantity: 10, costAtTime: 1200 },
          { productId: products[1].id, quantity: 5, costAtTime: 2400 },
          { productId: products[6].id, quantity: 20, costAtTime: 80 },
          { productId: products[14].id, quantity: 5, costAtTime: 750 },
        ],
      },
    },
  })

  const po2 = await prisma.purchase.create({
    data: {
      shopId: shop.id,
      supplierId: supplier2.id,
      purchaseNumber: "PO-0002",
      totalAmount: 39800,
      status: "RECEIVED",
      purchasedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: products[2].id, quantity: 8, costAtTime: 1800 },
          { productId: products[3].id, quantity: 5, costAtTime: 3200 },
          { productId: products[4].id, quantity: 3, costAtTime: 2800 },
          { productId: products[12].id, quantity: 5, costAtTime: 350 },
          { productId: products[13].id, quantity: 6, costAtTime: 180 },
        ],
      },
    },
  })
  console.log("Purchases created: 2", po1.purchaseNumber, po2.purchaseNumber)

  // Sample Sales
  const sale1 = await prisma.sale.create({
    data: {
      shopId: shop.id,
      saleNumber: "SALE-0001",
      status: "COMPLETED",
      subtotal: 4347,
      discount: 0,
      tax: 0,
      total: 4347,
      paymentMode: "CASH",
      soldAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: products[0].id, quantity: 1, priceAtTime: 1599 },
          { productId: products[2].id, quantity: 1, priceAtTime: 2399 },
          { productId: products[6].id, quantity: 2, priceAtTime: 149 },
        ],
      },
    },
  })

  const sale2 = await prisma.sale.create({
    data: {
      shopId: shop.id,
      saleNumber: "SALE-0002",
      status: "COMPLETED",
      subtotal: 1097,
      discount: 100,
      tax: 0,
      total: 997,
      paymentMode: "PHONEPE",
      soldAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: products[8].id, quantity: 1, priceAtTime: 599 },
          { productId: products[9].id, quantity: 1, priceAtTime: 499 },
        ],
      },
    },
  })

  const sale3 = await prisma.sale.create({
    data: {
      shopId: shop.id,
      saleNumber: "SALE-0003",
      status: "COMPLETED",
      subtotal: 4447,
      discount: 200,
      tax: 0,
      total: 4247,
      paymentMode: "CASH",
      soldAt: new Date(),
      items: {
        create: [
          { productId: products[1].id, quantity: 1, priceAtTime: 3199 },
          { productId: products[10].id, quantity: 2, priceAtTime: 249 },
          { productId: products[11].id, quantity: 1, priceAtTime: 349 },
          { productId: products[5].id, quantity: 1, priceAtTime: 999 - 199 },
        ],
      },
    },
  })
  console.log("Sales created: 3", sale1.saleNumber, sale2.saleNumber, sale3.saleNumber)

  console.log("Done!")

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})