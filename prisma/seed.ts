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

  const shop = await prisma.shop.create({
    data: {
      name: "Rishika Computers",
      address: "16-11-740/9/1, Rudra Towers, Dilsukh Nagar, Hyderabad - 500060",
      phone: "040-XXXXXXXX",
      email: "rishikacomputers@gmail.com",
    },
  })

  console.log("Shop created:", shop.name)

  const hashedPassword = await bcrypt.hash("owner123", 10)

  const owner = await prisma.user.create({
    data: {
      shopId: shop.id,
      name: "Krishna Reddy",
      email: "krishna@rishikacomputers.com",
      password: hashedPassword,
      role: "OWNER",
      phone: "9999999999",
    },
  })

  console.log("Owner created:", owner.name)
  console.log("Email:", owner.email)
  console.log("Password: owner123")
  console.log("Done!")

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})