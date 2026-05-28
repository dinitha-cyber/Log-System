import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Users, LogOut, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export function Sidebar({ role, onItemClick }: { role: 'user' | 'admin' | null; onItemClick?: () => void }) {
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const links = role === 'admin'
    ? [
      { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
      { href: '/admin/users', label: 'Team Members', icon: Users },
    ]
    : [
      { href: '/dashboard', label: 'My Logs', icon: LayoutDashboard },
      { href: '/dashboard/new', label: 'New Work Log', icon: PlusCircle },
    ]

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-slate-200 shadow-xl shadow-blue-900/5 transition-all">
      <div className="flex h-16 items-center px-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="rounded-md bg-blue-100 p-1.5">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Log Manager</h1>
        </div>
        {role === 'admin' && (
          <span className="ml-auto text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold shadow-sm">
            Admin
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (pathname.startsWith(`${link.href}/`) && link.href !== '/dashboard' && link.href !== '/admin')

          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={onItemClick}
              className={cn(
                "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn(
                "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"
              )} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex flex-col space-y-4">
        <button
          onClick={() => {
            handleSignOut()
            onItemClick?.()
          }}
          className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 ease-in-out"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
          Sign out
        </button>
        <div className="text-center pt-2 border-t border-slate-200/50">
          <p className="text-xs text-slate-500">
            Developed by : <br/>
            <a href="https://dinithaweb.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500 transition-colors hover:underline">
              Dinitha Serasinghe
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
