import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import NewPurchaseClient from './NewPurchaseClient'

export const metadata = { title: 'New Purchase — Rishika Computers' }

export default async function NewPurchasePage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ where: { shopId: user.shopId }, orderBy: { name: 'asc' } }),
    prisma.product.findMany({
      where: { shopId: user.shopId, isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const serializedProducts = products.map(p => ({
    ...p,
    costPrice: Number(p.costPrice),
    sellPrice: Number(p.sellPrice),
  }))

  return <NewPurchaseClient suppliers={suppliers} products={serializedProducts} />
}
