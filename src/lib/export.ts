import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { supabase } from './supabase'
import { format } from 'date-fns'

export async function exportLogs(logsOrType: 'all' | 'member' | any[], userIdOrFilename?: string) {
  let logs: any[] = []
  let filename = 'Work_Logs.xlsx'

  if (Array.isArray(logsOrType)) {
    logs = logsOrType
    filename = userIdOrFilename || 'Work_Logs.xlsx'
  } else {
    const type = logsOrType
    const userId = userIdOrFilename
    
    let query = supabase.from('work_logs').select(`
      *,
      profiles (full_name)
    `).order('date', { ascending: false }).order('time_start', { ascending: false })

    if (type === 'member' && userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching logs for export:', error)
      alert(`Failed to fetch data for export: ${error.message}`)
      return
    }
    
    logs = data || []
    filename = type === 'all' ? 'All_Members_Work_Logs.xlsx' : `Member_Logs_${userId}.xlsx`
  }

  if (logs.length === 0) {
    alert("No work logs found to export.")
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Work Logs')

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Time Start', key: 'time_start', width: 15 },
    { header: 'Time End', key: 'time_end', width: 15 },
    { header: 'Work Description', key: 'work_description', width: 40 },
    { header: 'Assigned By', key: 'assigned_by', width: 20 },
    { header: 'Covering For', key: 'covering_for_who', width: 20 },
  ]

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }

  logs.forEach(log => {
    worksheet.addRow({
      date: format(new Date(log.date), 'MMM d, yyyy'),
      name: log.profiles?.full_name || 'Unknown',
      time_start: log.time_start.slice(0, 5),
      time_end: log.time_end.slice(0, 5),
      work_description: log.work_description,
      assigned_by: log.is_assigned ? log.assigned_by : '-',
      covering_for_who: log.is_covering_for_someone ? log.covering_for_who : '-'
    })
  })

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: {style:'thin'},
        left: {style:'thin'},
        bottom: {style:'thin'},
        right: {style:'thin'}
      }
      if (rowNumber > 1) {
        cell.alignment = { vertical: 'middle', wrapText: true }
      }
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename)
}
