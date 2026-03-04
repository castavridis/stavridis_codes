import { getSupabase } from './client'
import { Project } from '@/types/project'

export async function getAllProjects(): Promise<Project[]> {
  const client = getSupabase()
  if (!client) return []

  const { data, error } = await client
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch projects:', error.message)
    return []
  }
  return data ?? []
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const client = getSupabase()
  if (!client) return null

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}
