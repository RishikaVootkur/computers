import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'rishika-computers-secret'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, role } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Name, email, password and role are required' }, { status: 400 })
    }

    if (!['STAFF', 'CUSTOMER'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ message: 'An account with this email already exists' }, { status: 409 })
    }

    // Get the shop — single-shop app, always the first shop
    const shop = await prisma.shop.findFirst()
    if (!shop) {
      return NextResponse.json({ message: 'Shop not found. Contact the owner.' }, { status: 500 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          shopId: shop.id,
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          role,
        },
      })

      if (role === 'STAFF') {
        // Create Staff record so owner can manage salary/attendance
        await tx.staff.create({
          data: {
            userId: user.id,
            shopId: shop.id,
            monthlySalary: 0, // Owner sets this later
          },
        })
      }

      if (role === 'CUSTOMER') {
        // Create or link Customer record by phone
        if (phone) {
          await tx.customer.upsert({
            where: { shopId_phone: { shopId: shop.id, phone } },
            update: { name },
            create: { shopId: shop.id, name, phone, email },
          })
        }
      }

      return user
    })

    const token = jwt.sign(
      { userId: user.id, shopId: user.shopId, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      message: 'Account created successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, { status: 201 })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
