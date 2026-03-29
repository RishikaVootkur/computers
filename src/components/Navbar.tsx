import { cookies } from 'next/headers'
import Link from 'next/link'
import { Monitor, ClipboardList, Plus, UserCircle2, Users, ShoppingBag, CalendarOff } from 'lucide-react'
import { verifyToken } from '@/lib/auth'
import LogoutButton from './LogoutButton'

export default async function Navbar() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const user = token ? verifyToken(token) : null

  const homeHref = user?.role === 'OWNER' ? '/owner' : '/dashboard'
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <nav className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
      <div className="px-4 sm:px-8 flex items-center justify-between h-14">

        {/* Left: Logo + nav links */}
        <div className="flex items-center gap-1">
          <Link
            href={homeHref}
            className="flex items-center gap-2 mr-4 text-primary font-bold text-base"
          >
            <Monitor className="w-5 h-5" />
            <span className="hidden sm:block">Rishika Computers</span>
          </Link>

          {user?.role === 'OWNER' && (
            <>
              <NavLink href="/owner" icon={<ClipboardList className="w-4 h-4" />}>Overview</NavLink>
              <NavLink href="/dashboard" icon={<ClipboardList className="w-4 h-4" />}>Jobs</NavLink>
              <NavLink href="/owner/customers" icon={<UserCircle2 className="w-4 h-4" />}>Customers</NavLink>
              <NavLink href="/owner/hr" icon={<Users className="w-4 h-4" />}>HR</NavLink>
              <NavLink href="/owner/sales" icon={<ShoppingBag className="w-4 h-4" />}>Sales</NavLink>
            </>
          )}

          {user?.role === 'STAFF' && (
            <>
              <NavLink href="/dashboard" icon={<ClipboardList className="w-4 h-4" />}>My Jobs</NavLink>
              <NavLink href="/staff/leave" icon={<CalendarOff className="w-4 h-4" />}>Leave</NavLink>
            </>
          )}
        </div>

        {/* Right: New Job + user info + logout */}
        <div className="flex items-center gap-3">
          {user && (
            <Link
              href="/service/new"
              className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Job
            </Link>
          )}

          {user && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs font-semibold text-foreground leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>
          )}

          <div className="w-px h-5 bg-border" />
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
    >
      {icon}
      <span className="hidden sm:block">{children}</span>
    </Link>
  )
}
