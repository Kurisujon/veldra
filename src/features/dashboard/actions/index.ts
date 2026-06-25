'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export interface DashboardMetrics {
  activeCasesCount: number
  pendingReviewCount: number
  resolvedTodayCount: number
  avgProcessingTimeMinutes: number
}

export interface RecentActivity {
  id: string
  user: string
  action: string
  time: string
  created_at: string
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient()

  // Active cases (anything not completed/exported)
  const { count: activeCount } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'Exported')

  // Pending Review cases
  const { count: pendingCount } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'NeedsReview')

  // Resolved Today (findings resolved today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count: resolvedToday } = await supabase
    .from('findings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Resolved')
    .gte('updated_at', today.toISOString())

  // Average processing time is complex, we will leave as mock or basic calculation
  // For now, let's just return a static number until we have full timestamps
  const avgProcessingTimeMinutes = 14

  return {
    activeCasesCount: activeCount || 0,
    pendingReviewCount: pendingCount || 0,
    resolvedTodayCount: resolvedToday || 0,
    avgProcessingTimeMinutes
  }
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      id,
      action_type,
      description,
      created_at,
      user_roles!inner(role)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data) {
    return []
  }

  return data.map((log: any) => {
    // Basic relative time formatting
    const diffMs = new Date().getTime() - new Date(log.created_at).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    let timeStr = 'just now'
    if (diffDays > 0) timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    else if (diffHours > 0) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    else if (diffMins > 0) timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`

    return {
      id: log.id,
      user: log.user_roles?.role || 'System',
      action: log.description,
      time: timeStr,
      created_at: log.created_at
    }
  })
}
