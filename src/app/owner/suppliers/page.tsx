import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import SalesSubNav from '@/components/SalesSubNav'
import SuppliersClient from './SuppliersClient'

export const metadata = { title: 'Suppliers — Rishika Computers' }

export default async function SuppliersPage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const suppliers = await prisma.supplier.findMany({
    where: { shopId: user.shopId },
    include: { _count: { select: { purchases: true, products: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SalesSubNav />
      <main className="px-4 sm:px-8 py-8">
        <SuppliersClient suppliers={suppliers} />
      </main>
    </div>
  )
}
