'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Tag, Truck, ShoppingCart } from 'lucide-react'

const tabs = [
  { label: 'Sales', href: '/owner/sales', icon: ShoppingBag },
  { label: 'Products', href: '/owner/products', icon: Tag },
  { label: 'Suppliers', href: '/owner/suppliers', icon: Truck },
  { label: 'Purchases', href: '/owner/purchases', icon: ShoppingCart },
]

export default function SalesSubNav() {
  const path = usePathname()

  function isActive(href: string) {
    if (href === '/owner/sales') {
      // active for /owner/sales and /owner/sales/... but NOT /owner/products etc
      return path === '/owner/sales' || path.startsWith('/owner/sales/')
    }
    return path === href || path.startsWith(href + '/')
  }

  return (
    <div className="bg-white border-b sticky top-14 z-40">
      <div className="px-4 sm:px-8 flex">
        {tabs.map(t => (
          <Link key={t.href} href={t.href}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive(t.href)
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
