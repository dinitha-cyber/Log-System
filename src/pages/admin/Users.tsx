import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, ShieldAlert, ShieldCheck } from 'lucide-react'
import { exportLogs } from '@/lib/export'

type Profile = {
  id: string
  full_name: string
  role: 'user' | 'admin'
  created_at: string
}

export function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    
    // Get the current logged-in admin's ID
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }

    const { data } = await supabase.from('profiles').select('*').order('full_name')
    if (data) setUsers(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as 'user' | 'admin' } : u))
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Members</h1>
          <p className="text-slate-500 mt-2">
            Manage IT team members, their roles, and export individual logs.
          </p>
        </div>
        <Link to="/admin">
          <Button variant="outline" className="text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Logs
          </Button>
        </Link>
      </div>

      {/* Mobile Card List */}
      <div className="space-y-4 md:hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-slate-500">Loading team members...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5 text-slate-500">
            <p className="text-sm">No users found.</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-blue-900/5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 flex items-center">
                  {user.full_name || 'Unknown User'}
                  {user.id === currentUserId && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      You
                    </span>
                  )}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition-colors ${
                  user.role === 'admin' 
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {user.role}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                {user.id !== currentUserId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleRole(user.id, user.role)}
                    className="h-8 text-xs shadow-sm hover:shadow-md transition-all"
                  >
                    {user.role === 'admin' ? (
                      <><ShieldAlert className="mr-1 h-3.5 w-3.5 text-orange-500" /> Demote</>
                    ) : (
                      <><ShieldCheck className="mr-1 h-3.5 w-3.5 text-blue-500" /> Make Admin</>
                    )}
                  </Button>
                )}
                <Button 
                  size="sm"
                  onClick={() => exportLogs('member', user.id)}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-sm shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-[0.98]"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export Logs
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xl shadow-blue-900/5 overflow-hidden transition-all hover:shadow-blue-900/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Name</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Role</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 text-slate-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p>Loading team members...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 flex items-center">
                      {user.full_name || 'Unknown User'}
                      {user.id === currentUserId && (
                        <span className="ml-3 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition-colors ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                        {user.id !== currentUserId && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleRole(user.id, user.role)}
                            className="h-8 shadow-sm hover:shadow-md transition-all"
                          >
                            {user.role === 'admin' ? (
                              <><ShieldAlert className="mr-2 h-3.5 w-3.5 text-orange-500" /> Demote to User</>
                            ) : (
                              <><ShieldCheck className="mr-2 h-3.5 w-3.5 text-blue-500" /> Make Admin</>
                            )}
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          onClick={() => exportLogs('member', user.id)}
                          className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-[0.98]"
                        >
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Export Logs
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

