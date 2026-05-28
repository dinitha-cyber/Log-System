import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'

export function EditLog() {
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [isAssigned, setIsAssigned] = useState(false)
  const [assignedBy, setAssignedBy] = useState('')
  const [isCovering, setIsCovering] = useState(false)
  const [coveringWho, setCoveringWho] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    async function loadLog() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: log, error: fetchError } = await supabase
          .from('work_logs')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (fetchError) throw fetchError
        if (!log) throw new Error('Log not found')

        setDate(log.date)
        setDescription(log.work_description)
        setTimeStart(log.time_start.slice(0, 5))
        setTimeEnd(log.time_end.slice(0, 5))
        setIsAssigned(log.is_assigned)
        setAssignedBy(log.assigned_by || '')
        setIsCovering(log.is_covering_for_someone)
        setCoveringWho(log.covering_for_who || '')

      } catch (err: any) {
        setError(err.message || 'Failed to load log')
      } finally {
        setLoading(false)
      }
    }
    if (id) {
      loadLog()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (timeEnd <= timeStart) {
      setError('Time End must be after Time Start')
      setSaving(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('work_logs')
        .update({
          date,
          work_description: description,
          time_start: timeStart,
          time_end: timeEnd,
          is_assigned: isAssigned,
          assigned_by: isAssigned ? assignedBy : null,
          is_covering_for_someone: isCovering,
          covering_for_who: isCovering ? coveringWho : null,
        })
        .eq('id', id)

      if (updateError) throw updateError
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to update log')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Work Log</h1>
          <p className="text-slate-500 mt-2">
            Update your task details.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-blue-900/5 p-6 sm:p-8 transition-all hover:shadow-blue-900/10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-100 shadow-sm">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-700 font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-slate-200 focus-visible:ring-blue-500 transition-shadow shadow-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeStart" className="text-slate-700 font-medium">Time Start</Label>
                <Input
                  id="timeStart"
                  type="time"
                  required
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="border-slate-200 focus-visible:ring-blue-500 transition-shadow shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeEnd" className="text-slate-700 font-medium">Time End</Label>
                <Input
                  id="timeEnd"
                  type="time"
                  required
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="border-slate-200 focus-visible:ring-blue-500 transition-shadow shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 font-medium">Work Description</Label>
            <Textarea
              id="description"
              required
              placeholder="Describe what you worked on..."
              className="min-h-[140px] border-slate-200 focus-visible:ring-blue-500 transition-shadow shadow-sm resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
            <div className="space-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Did someone tell you to do it?</Label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      className="text-blue-600 focus:ring-blue-600 w-4 h-4 border-slate-300"
                      checked={isAssigned === true}
                      onChange={() => setIsAssigned(true)}
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      className="text-blue-600 focus:ring-blue-600 w-4 h-4 border-slate-300"
                      checked={isAssigned === false}
                      onChange={() => {
                        setIsAssigned(false)
                        setAssignedBy('')
                      }}
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">No</span>
                  </label>
                </div>
              </div>

              <div className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${isAssigned ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <Label htmlFor="assignedBy" className="text-slate-700">Who requested this?</Label>
                <Input
                  id="assignedBy"
                  required={isAssigned}
                  placeholder="Manager's Name or Ticket ID"
                  value={assignedBy}
                  onChange={(e) => setAssignedBy(e.target.value)}
                  className="border-slate-200 focus-visible:ring-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Are you covering for another member's work?</Label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      className="text-blue-600 focus:ring-blue-600 w-4 h-4 border-slate-300"
                      checked={isCovering === true}
                      onChange={() => setIsCovering(true)}
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      className="text-blue-600 focus:ring-blue-600 w-4 h-4 border-slate-300"
                      checked={isCovering === false}
                      onChange={() => {
                        setIsCovering(false)
                        setCoveringWho('')
                      }}
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">No</span>
                  </label>
                </div>
              </div>

              <div className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${isCovering ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <Label htmlFor="coveringWho" className="text-slate-700">Whose work are you covering?</Label>
                <Input
                  id="coveringWho"
                  required={isCovering}
                  placeholder="Team Member's Name"
                  value={coveringWho}
                  onChange={(e) => setCoveringWho(e.target.value)}
                  className="border-slate-200 focus-visible:ring-blue-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              className="mr-4 text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              onClick={() => navigate('/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-blue-500/40 active:scale-[0.98]"
            >
              {saving ? 'Updating...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
