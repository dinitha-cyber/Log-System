import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Sidebar } from './Sidebar'
import { Menu, X, Activity } from 'lucide-react'

export function MainLayout({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'user' | 'admin' | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        navigate('/login', { replace: true })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      let currentRole = profile?.role as 'user' | 'admin' | null

      // Auto-fix admin role for the designated admin email
      if (session.user.email === 'plmttit@gmail.com' && currentRole !== 'admin') {
        await supabase.from('profiles').upsert({ 
          id: session.user.id, 
          role: 'admin',
          full_name: session.user.user_metadata?.full_name || 'IT Admin',
          designation: session.user.user_metadata?.designation || 'System Administrator'
        })
        currentRole = 'admin'
      }

      setRole(currentRole)

      if (requireAdmin && currentRole !== 'admin') {
        navigate('/dashboard', { replace: true })
        return
      }
      
      if (!requireAdmin && currentRole === 'admin' && location.pathname.startsWith('/dashboard')) {
        navigate('/admin', { replace: true })
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [navigate, requireAdmin, location.pathname])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 selection:bg-blue-200 flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="flex h-16 items-center px-4 border-b border-slate-200 bg-white justify-between md:hidden shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-1.5">
            <div className="rounded-md bg-blue-100 p-1">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">Log Manager</span>
          </div>
        </div>
        {role === 'admin' && (
          <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold shadow-sm">
            Admin
          </span>
        )}
      </div>

      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar role={role} />
      </div>

      {/* Mobile Sidebar (Slide-over Drawer) */}
      {mobileMenuOpen && (
        <div className="relative z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 flex w-64 max-w-xs bg-white shadow-xl animate-slide-in">
            <div className="relative flex flex-1 flex-col">
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar role={role} onItemClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-white/50 pointer-events-none" />
        <div className="relative z-10 w-full p-4 sm:p-6 lg:p-8">
          <Outlet context={{ role }} />
        </div>
      </main>
    </div>
  )
}

