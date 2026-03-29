import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, CalendarDays, Wallet, Package, BarChart2, CalendarOff } from 'lucide-react'

export const metadata = { title: 'HR — Rishika Computers' }

export default async function HRPage() {
  const user = await getAuthUser()
  if (!user || user.role !== 'OWNER') redirect('/login')

  const [staffCount, pendingLeave, lowStockCount] = await Promise.all([
    prisma.staff.count({ where: { shopId: user.shopId, isActive: true } }),
    prisma.leaveRequest.count({ where: { staff: { shopId: user.shopId }, status: 'PENDING' } }),
    prisma.inventoryItem.findMany({ where: { shopId: user.shopId } })
      .then(items => items.filter(i => i.stock <= i.minStock).length),
  ])

  const cards = [
    {
      href: '/owner/staff',
      icon: Users,
      label: 'Staff',
      description: 'Add, view and deactivate team members',
      badge: `${staffCount} active`,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      href: '/owner/attendance',
      icon: CalendarDays,
      label: 'Attendance',
      description: 'Mark and review monthly attendance',
      badge: null,
      color: 'text-green-600 bg-green-50',
    },
    {
      href: '/owner/salary',
      icon: Wallet,
      label: 'Salary',
      description: 'Calculate salary and record payments',
      badge: null,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      href: '/owner/leave',
      icon: CalendarOff,
      label: 'Leave Requests',
      description: 'Approve or reject leave applications',
      badge: pendingLeave > 0 ? `${pendingLeave} pending` : null,
      badgeColor: 'bg-amber-100 text-amber-700',
      color: 'text-amber-600 bg-amber-50',
    },
    {
      href: '/owner/staff-performance',
      icon: BarChart2,
      label: 'Performance',
      description: 'Monthly staff job completion report',
      badge: null,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      href: '/owner/inventory',
      icon: Package,
      label: 'Spare Parts',
      description: 'Manage service inventory and stock levels',
      badge: lowStockCount > 0 ? `${lowStockCount} low stock` : null,
      badgeColor: 'bg-red-100 text-red-700',
      color: 'text-red-600 bg-red-50',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">HR &amp; Operations</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your team, attendance, salary and inventory</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link key={card.href} href={card.href}
            className="bg-white border rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              {card.badge && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${'badgeColor' in card && card.badgeColor ? card.badgeColor : 'bg-gray-100 text-gray-600'}`}>
                  {card.badge}
                </span>
              )}
            </div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{card.label}</div>
            <div className="text-sm text-gray-500 mt-1">{card.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
