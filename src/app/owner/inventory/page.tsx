import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import InventoryClient from './InventoryClient'

export default async function InventoryPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'OWNER') redirect('/dashboard')

  const items = await prisma.inventoryItem.findMany({
    where: { shopId: user.shopId },
    orderBy: { name: 'asc' },
  })

  const lowStock = items.filter((i) => i.stock <= i.minStock)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Spare parts and stock management</p>
          </div>
        </div>
        {lowStock.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            ⚠ {lowStock.length} item{lowStock.length > 1 ? 's are' : ' is'} low on stock:{' '}
            {lowStock.map((i) => i.name).join(', ')}
          </div>
        )}
        <InventoryClient initialItems={items.map((i) => ({
          ...i,
          costPrice: i.costPrice ? String(i.costPrice) : null,
        }))} />
      </main>
    </div>
  )
}
