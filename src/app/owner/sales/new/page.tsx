import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import NewSaleClient from './NewSaleClient'

export const metadata = { title: 'New Sale — Rishika Computers' }

export default async function NewSalePage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const [products, customers] = await Promise.all([
    prisma.product.findMany({
      where: { shopId: user.shopId, isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({
      where: { shopId: user.shopId },
      orderBy: { name: 'asc' },
    }),
  ])

  const serializedProducts = products.map(p => ({
    ...p,
    costPrice: Number(p.costPrice),
    sellPrice: Number(p.sellPrice),
  }))

  return <NewSaleClient products={serializedProducts} customers={customers} />
}
