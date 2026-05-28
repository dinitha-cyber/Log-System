import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Search, Users, ArrowUpDown } from 'lucide-react'
import { exportLogs } from '@/lib/export'

type Log = {
  id: string
  user_id: string
  date: string
  work_description: string
  time_start: string
  time_end: string
  is_assigned: boolean
  assigned_by: string
  is_covering_for_someone: boolean
  covering_for_who: string
  user_name?: string
}

export function AdminDashboard() {
  const [logs, setLogs] = useState<Log[]>([])
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchLogs = async () => {
    setLoading(true)
    let query = supabase.from('work_logs').select(`
      *,
      profiles(full_name)
    `).order('date', { ascending: false }).order('time_start', { ascending: false })
    
    if (dateFilter) {
      query = query.eq('date', dateFilter)
    }

    const { data, error } = await query
    
    if (error) {
      console.error("Error fetching admin logs:", error)
    }

    if (data) {
      const mappedLogs = data.map((item: any) => ({
        ...item,
        user_name: item.profiles?.full_name || 'Unknown User'
      }))
      setLogs(mappedLogs)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()

    const channel = supabase
      .channel('work_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'work_logs' }, async (payload) => {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', payload.new.user_id).single()
        const newLog = { ...payload.new, user_name: profile?.full_name || 'Unknown User' } as Log
        setLogs((current) => [newLog, ...current])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dateFilter])

  const filteredLogs = logs.filter(log => 
    (log.user_name || '').toLowerCase().includes(search.toLowerCase()) || 
    log.work_description.toLowerCase().includes(search.toLowerCase())
  )

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateTimeA = `${a.date}T${a.time_start}`
    const dateTimeB = `${b.date}T${b.time_start}`
    if (dateTimeA < dateTimeB) return sortOrder === 'asc' ? -1 : 1
    if (dateTimeA > dateTimeB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Real-Time Logs</h1>
          <p className="text-slate-500 mt-2">
            Monitor and export team activity across the organization.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/admin/users">
            <Button variant="outline" className="text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm transition-colors">
              <Users className="mr-2 h-4 w-4" /> Manage Team
            </Button>
          </Link>
          <Button 
            onClick={() => exportLogs(sortedLogs, 'Team_Members_Work_Logs.xlsx')} 
            className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20 transition-all hover:shadow-green-500/40"
          >
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-slate-200 focus-visible:ring-blue-500 shadow-sm bg-white"
          />
        </div>
        <div className="w-full sm:w-48">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border-slate-200 focus-visible:ring-blue-500 shadow-sm bg-white"
          />
        </div>
        {dateFilter && (
          <Button variant="outline" onClick={() => setDateFilter('')} className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-white">
            Clear
          </Button>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="space-y-4 md:hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-slate-500">Loading real-time logs...</p>
          </div>
        ) : sortedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5 text-slate-500">
            <p className="text-sm">No work logs found matching criteria.</p>
          </div>
        ) : (
          sortedLogs.map((log) => (
            <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-blue-900/5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 text-sm">
                  {log.user_name}
                </span>
                <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded-md">
                  {format(new Date(log.date), 'MMM d, yyyy')}
                </span>
              </div>
              
              <div className="text-xs text-slate-500 font-medium">
                Time: {log.time_start.slice(0, 5)} - {log.time_end.slice(0, 5)}
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
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">User</th>
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
                <th scope="col" className="px-6 py-4 font-semibold w-1/3 tracking-wider">Description</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Assigned By</th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Covering For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 text-slate-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p>Loading real-time logs...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No work logs found matching criteria.
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {log.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {format(new Date(log.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {log.time_start.slice(0, 5)} - {log.time_end.slice(0, 5)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 text-slate-700">{log.work_description}</p>
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
