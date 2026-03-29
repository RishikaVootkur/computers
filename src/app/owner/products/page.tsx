import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import SalesSubNav from '@/components/SalesSubNav'
import ProductsClient from './ProductsClient'

export const metadata = { title: 'Products — Rishika Computers' }

export default async function ProductsPage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const [products, categories, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: { shopId: user.shopId, isActive: true },
      include: { category: true, supplier: true },
      orderBy: { name: 'asc' },
    }),
    prisma.productCategory.findMany({ where: { shopId: user.shopId }, orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ where: { shopId: user.shopId }, orderBy: { name: 'asc' } }),
  ])

  const serialized = products.map(p => ({
    ...p,
    costPrice: Number(p.costPrice),
    sellPrice: Number(p.sellPrice),
  }))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SalesSubNav />
      <main className="px-4 sm:px-8 py-8">
        <ProductsClient products={serialized} categories={categories} suppliers={suppliers} />
      </main>
    </div>
  )
}
