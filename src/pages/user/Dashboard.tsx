import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { LogActions } from '@/components/LogActions'
import { Button } from '@/components/ui/button'
import { Plus, X, Clock, ArrowUpDown, Download } from 'lucide-react'
import { exportLogs } from '@/lib/export'

type Log = {
  id: string
  date: string
  work_description: string
  time_start: string
  time_end: string
  is_assigned: boolean
  assigned_by: string
  is_covering_for_someone: boolean
  covering_for_who: string
}

export function Dashboard() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [userName, setUserName] = useState('My Logs')

  const fetchLogs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('work_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('time_start', { ascending: false })

    if (data) {
      setLogs(data)
    }

    // Get user full name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserName(profile.full_name)
    }

    setLoading(false)
  }

  const sortedLogs = [...logs].sort((a, b) => {
    const dateTimeA = `${a.date}T${a.time_start}`
    const dateTimeB = `${b.date}T${b.time_start}`
    if (dateTimeA < dateTimeB) return sortOrder === 'asc' ? -1 : 1
    if (dateTimeA > dateTimeB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleLogDeleted = () => {
    fetchLogs()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Work Logs</h1>
          <p className="text-slate-500 mt-2">
            View and manage your recent work activities.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => {
              const logsForExport = sortedLogs.map(log => ({
                ...log,
                profiles: { full_name: userName }
              }))
              exportLogs(logsForExport, `My_Work_Logs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
            }} 
            variant="outline" 
            className="text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="mr-2 h-4 w-4 text-green-600" /> Export Excel
          </Button>
          <Link to="/dashboard/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-blue-500/40">
              <Plus className="w-4 h-4 mr-2" /> Add New Log
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="space-y-4 md:hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-slate-500">Loading logs...</p>
          </div>
        ) : sortedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5 text-slate-500">
            <div className="p-3 bg-slate-50 rounded-full">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm">No work logs found. Create one to get started!</p>
          </div>
        ) : (
          sortedLogs.map((log) => (
            <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-blue-900/5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-semibold text-slate-900">
                  {format(new Date(log.date), 'MMM d, yyyy')}
                </span>
                <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded-md">
                  {log.time_start.slice(0, 5)} - {log.time_end.slice(0, 5)}
                </span>
              </div>
              
              <div className="text-sm text-slate-700">
                <p className="line-clamp-3 leading-relaxed whitespace-pre-wrap">{log.work_description}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {log.is_assigned && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    By: {log.assigned_by}
                  </span>
                )}
                {log.is_covering_for_someone && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                    Covering: {log.covering_for_who}
                  </span>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <LogActions 
                  logId={log.id} 
                  onDelete={handleLogDeleted} 
                  onView={() => setSelectedLog(log)} 
                />
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
                <th 
                  scope="col" 
                  className="px-6 py-4 font-semibold tracking-wider cursor-pointer select-none hover:text-blue-600 transition-colors"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <ArrowUpDown className="h-4 w-4 text-slate-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Time</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider w-1/3">Description</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Assigned By</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Covering For</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p>Loading logs...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-slate-50 rounded-full">
                        <Plus className="w-6 h-6 text-slate-400" />
                      </div>
                      <p>No work logs found. Create one to get started!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {format(new Date(log.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                      {log.time_start.slice(0, 5)} - {log.time_end.slice(0, 5)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <p className="line-clamp-2">{log.work_description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {log.is_assigned ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.assigned_by}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {log.is_covering_for_someone ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {log.covering_for_who}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end">
                        <LogActions 
                          logId={log.id} 
                          onDelete={handleLogDeleted} 
                          onView={() => setSelectedLog(log)} 
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Log Modal */}
      {selectedLog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Work Log Details</h3>
                <p className="text-xs mt-0.5 font-medium text-slate-500">
                  Logged on {format(new Date(selectedLog.date), 'MMMM d, yyyy')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6 overflow-y-auto">
              {/* Time */}
              <div className="flex items-center space-x-3 text-slate-700 bg-blue-50/50 px-4 py-3 rounded-xl border border-blue-100/50">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {selectedLog.time_start.slice(0, 5)} - {selectedLog.time_end.slice(0, 5)}
                </span>
                <span className="text-xs text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-md font-medium">
                  Work Session
                </span>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Work Description</h4>
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-slate-800 text-sm whitespace-pre-wrap break-words leading-relaxed max-h-[300px] overflow-y-auto">
                  {selectedLog.work_description}
                </div>
              </div>

              {/* Extra Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Assigned By</h4>
                  {selectedLog.is_assigned ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {selectedLog.assigned_by}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm font-medium">Self-assigned</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Covering For</h4>
                  {selectedLog.is_covering_for_someone ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                      {selectedLog.covering_for_who}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm font-medium">None</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <Button
                variant="outline"
                className="text-slate-700 border-slate-200 hover:bg-slate-100 bg-white"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
              <Link to={`/dashboard/edit/${selectedLog.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40">
                  Edit Log
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

