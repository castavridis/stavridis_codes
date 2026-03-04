export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image_url: string | null
  tags: string[] | null
  role: string | null
  year: number | null
  sort_order: number
}
