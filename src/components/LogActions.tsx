import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, AlertTriangle, Eye } from 'lucide-react'

export function LogActions({ 
  logId, 
  onDelete, 
  onView 
}: { 
  logId: string
  onDelete: () => void
  onView: () => void 
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this work log? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    const { error } = await supabase
      .from('work_logs')
      .delete()
      .eq('id', logId)

    setIsDeleting(false)
    if (!error) {
      onDelete()
    } else {
      alert('Failed to delete work log')
    }
  }

  return (
    <div className="flex items-center justify-end space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onView}
        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
        title="View Log Details"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/dashboard/edit/${logId}`)}
        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
        title="Edit Log"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
        className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm"
        title="Delete Log"
      >
        {isDeleting ? <AlertTriangle className="h-4 w-4 animate-pulse text-red-500" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  )
}

