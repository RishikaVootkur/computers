import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId')
  const lowStock = searchParams.get('lowStock') === 'true'

  const allProducts = await prisma.product.findMany({
    where: {
      shopId: user.shopId,
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: true, supplier: true },
    orderBy: { name: 'asc' },
  })
  const products = lowStock ? allProducts.filter(p => p.stock <= p.minStock) : allProducts
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, description, sku, categoryId, supplierId, costPrice, sellPrice, stock, minStock } = await req.json()
  if (!name || costPrice == null || sellPrice == null) {
    return NextResponse.json({ error: 'name, costPrice, sellPrice required' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      shopId: user.shopId,
      name,
      description,
      sku: sku || null,
      categoryId: categoryId || null,
      supplierId: supplierId || null,
      costPrice,
      sellPrice,
      stock: stock ?? 0,
      minStock: minStock ?? 1,
    },
    include: { category: true, supplier: true },
  })
  return NextResponse.json(product, { status: 201 })
}
